package com.classmanager.service;

import com.classmanager.config.JwtTokenProvider;
import com.classmanager.dto.request.UserRegisterRequest;
import com.classmanager.dto.response.AuthResponse;
import com.classmanager.entity.*;
import com.classmanager.exception.AppException;
import com.classmanager.repository.*;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final OtpService otpService;
    private final JwtTokenProvider tokenProvider;
    private final GoogleIdTokenVerifier googleVerifier;

    public AuthService(
            UserRepository userRepository,
            ClassRepository classRepository,
            TeacherProfileRepository teacherProfileRepository,
            StudentProfileRepository studentProfileRepository,
            OtpService otpService,
            JwtTokenProvider tokenProvider,
            @Value("${app.google.client-id}") String googleClientId) {
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.teacherProfileRepository = teacherProfileRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.otpService = otpService;
        this.tokenProvider = tokenProvider;
        this.googleVerifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    private GoogleIdToken verifyGoogleToken(String idTokenString) {
        try {
            GoogleIdToken idToken = googleVerifier.verify(idTokenString);
            if (idToken == null) {
                throw new AppException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "Google token không hợp lệ hoặc đã hết hạn");
            }
            return idToken;
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("[Auth Service] Google token verification failed", ex);
            throw new AppException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "Lỗi xác thực tài khoản Google: " + ex.getMessage());
        }
    }

    @Transactional
    public void register(UserRegisterRequest request) {
        boolean isGoogle = request.getGoogleIdToken() != null && !request.getGoogleIdToken().trim().isEmpty();
        String email = null;
        String phoneNumber = null;

        if (isGoogle) {
            GoogleIdToken idToken = verifyGoogleToken(request.getGoogleIdToken());
            email = idToken.getPayload().getEmail();

            if (userRepository.findByGoogleEmail(email).isPresent()) {
                throw new AppException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "Email này đã được đăng ký trước đó.");
            }
        } else {
            if (request.getPhoneNumber() == null || request.getOtpCode() == null) {
                throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Số điện thoại và mã OTP là bắt buộc khi đăng ký bằng số điện thoại.");
            }
            phoneNumber = request.getPhoneNumber();
            boolean otpVerified = otpService.verifyOtp(phoneNumber, request.getOtpCode());
            if (!otpVerified) {
                throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Mã OTP không đúng hoặc đã hết hạn.");
            }

            if (userRepository.findByPhoneNumber(phoneNumber).isPresent()) {
                throw new AppException(HttpStatus.CONFLICT, "PHONE_ALREADY_EXISTS", "Số điện thoại này đã được đăng ký trước đó.");
            }

            email = request.getEmail();
            if (email != null && !email.trim().isEmpty()) {
                if (userRepository.findByGoogleEmail(email).isPresent()) {
                    throw new AppException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "Email này đã được đăng ký trước đó.");
                }
            }
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .googleEmail(email)
                .phoneNumber(phoneNumber)
                .phoneVerified(!isGoogle)
                .role(UserRole.valueOf(request.getRole()))
                .approvalStatus(UserApprovalStatus.PENDING)
                .build();

        User savedUser = userRepository.save(user);

        if (savedUser.getRole() == UserRole.TEACHER) {
            TeacherProfile teacherProfile = TeacherProfile.builder()
                    .user(savedUser)
                    .build();
            teacherProfileRepository.save(teacherProfile);
        } else {
            if (request.getClassId() == null) {
                throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Lớp học là bắt buộc đối với Học sinh.");
            }
            ClassEntity classEntity = classRepository.findById(request.getClassId())
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Lớp học không tồn tại."));

            StudentProfile studentProfile = StudentProfile.builder()
                    .user(savedUser)
                    .classEntity(classEntity)
                    .status("STUDYING")
                    .build();
            studentProfileRepository.save(studentProfile);
        }
    }

    @Transactional
    public Map<String, Object> loginWithGoogle(String idTokenString) {
        GoogleIdToken idToken = verifyGoogleToken(idTokenString);
        String email = idToken.getPayload().getEmail();

        User user = userRepository.findByGoogleEmail(email)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "REGISTRATION_REQUIRED", "Tài khoản chưa được đăng ký. Vui lòng đăng ký trước."));

        if (user.getApprovalStatus() == UserApprovalStatus.PENDING) {
            throw new AppException(HttpStatus.FORBIDDEN, "PENDING_APPROVAL", "Tài khoản của bạn đang chờ phê duyệt.");
        }
        if (user.getApprovalStatus() == UserApprovalStatus.REJECTED) {
            throw new AppException(HttpStatus.FORBIDDEN, "REGISTRATION_REJECTED", "Tài khoản đăng ký đã bị từ chối. Lý do: " + user.getRejectionReason());
        }

        return generateTokensMap(user);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> refresh(String refreshToken) {
        if (refreshToken == null || !tokenProvider.validateToken(refreshToken)) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Refresh Token không hợp lệ hoặc đã hết hạn.");
        }

        String userIdStr = tokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(Integer.parseInt(userIdStr))
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Không tìm thấy người dùng."));

        if (user.getApprovalStatus() != UserApprovalStatus.APPROVED) {
            throw new AppException(HttpStatus.FORBIDDEN, "PENDING_APPROVAL", "Tài khoản chưa được phê duyệt.");
        }

        return generateTokensMap(user);
    }

    private Map<String, Object> generateTokensMap(User user) {
        Map<String, Object> additionalClaims = getAdditionalClaims(user);
        String accessToken = tokenProvider.generateAccessToken(user, additionalClaims);
        String newRefreshToken = tokenProvider.generateRefreshToken(user);

        Integer teacherProfileId = null;
        Integer studentProfileId = null;

        if (user.getRole() == UserRole.TEACHER) {
            teacherProfileId = teacherProfileRepository.findByUserId(user.getId())
                    .map(TeacherProfile::getId).orElse(null);
        } else if (user.getRole() == UserRole.STUDENT) {
            studentProfileId = studentProfileRepository.findByUserId(user.getId())
                    .map(StudentProfile::getId).orElse(null);
        }

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(accessToken)
                .expiresIn(7200)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .role(user.getRole().name())
                        .approvalStatus(user.getApprovalStatus().name())
                        .teacherProfileId(teacherProfileId)
                        .studentProfileId(studentProfileId)
                        .build())
                .build();

        Map<String, Object> result = new HashMap<>();
        result.put("authResponse", authResponse);
        result.put("refreshToken", newRefreshToken);
        return result;
    }

    private Map<String, Object> getAdditionalClaims(User user) {
        Map<String, Object> claims = new HashMap<>();
        if (user.getRole() == UserRole.TEACHER) {
            teacherProfileRepository.findByUserId(user.getId()).ifPresent(tp -> {
                claims.put("teacherProfileId", tp.getId());
            });
        } else if (user.getRole() == UserRole.STUDENT) {
            studentProfileRepository.findByUserId(user.getId()).ifPresent(sp -> {
                claims.put("studentProfileId", sp.getId());
                claims.put("classId", sp.getClassEntity().getId());
                if (sp.getGroup() != null) {
                    claims.put("groupId", sp.getGroup().getId());
                }
            });
        }
        return claims;
    }
}
