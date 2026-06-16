package com.classmanager.service;

import com.classmanager.dto.response.UserResponse;
import com.classmanager.entity.*;
import com.classmanager.exception.AppException;
import com.classmanager.repository.ClassRepository;
import com.classmanager.repository.StudentProfileRepository;
import com.classmanager.repository.TeacherProfileRepository;
import com.classmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final ClassRepository classRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public List<UserResponse> getPendingUsers(User currentUser) {
        if (currentUser.getRole() == UserRole.ADMIN) {
            return userRepository.findByApprovalStatusAndRole(UserApprovalStatus.PENDING, UserRole.TEACHER)
                    .stream()
                    .map(this::mapToUserResponse)
                    .collect(Collectors.toList());
        } else if (currentUser.getRole() == UserRole.TEACHER) {
            TeacherProfile teacherProfile = teacherProfileRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không tìm thấy hồ sơ giáo viên."));

            ClassEntity classEntity = classRepository.findByTeacherId(teacherProfile.getId())
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Giáo viên chưa được phân công lớp chủ nhiệm."));

            return userRepository.findPendingStudentsByClassId(UserApprovalStatus.PENDING, classEntity.getId())
                    .stream()
                    .map(this::mapToUserResponse)
                    .collect(Collectors.toList());
        }

        throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không có quyền thực hiện hành động này.");
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public UserResponse approveUser(Integer id, User currentUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy người dùng."));

        if (user.getApprovalStatus() != UserApprovalStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Người dùng không ở trạng thái chờ duyệt.");
        }

        validateApprovalPermission(user, currentUser);

        user.setApprovalStatus(UserApprovalStatus.APPROVED);
        user.setApprovedAt(Instant.now());
        User saved = userRepository.save(user);

        // Audit Log
        auditLogService.log(
                currentUser,
                "APPROVE_" + user.getRole().name(),
                "users",
                user.getId(),
                "{\"approvalStatus\":\"PENDING\"}",
                "{\"approvalStatus\":\"APPROVED\"}"
        );

        return mapToUserResponse(saved);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public UserResponse rejectUser(Integer id, String reason, User currentUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy người dùng."));

        if (user.getApprovalStatus() != UserApprovalStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Người dùng không ở trạng thái chờ duyệt.");
        }

        validateApprovalPermission(user, currentUser);

        user.setApprovalStatus(UserApprovalStatus.REJECTED);
        user.setRejectionReason(reason);
        User saved = userRepository.save(user);

        // Audit Log
        auditLogService.log(
                currentUser,
                "REJECT_" + user.getRole().name(),
                "users",
                user.getId(),
                "{\"approvalStatus\":\"PENDING\"}",
                "{\"approvalStatus\":\"REJECTED\",\"reason\":\"" + reason + "\"}"
        );

        return mapToUserResponse(saved);
    }

    private void validateApprovalPermission(User targetUser, User currentUser) {
        if (currentUser.getRole() == UserRole.ADMIN) {
            if (targetUser.getRole() != UserRole.TEACHER) {
                throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Admin chỉ có quyền duyệt tài khoản Giáo viên.");
            }
        } else if (currentUser.getRole() == UserRole.TEACHER) {
            if (targetUser.getRole() != UserRole.STUDENT) {
                throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Giáo viên chỉ có quyền duyệt tài khoản Học sinh.");
            }

            TeacherProfile teacherProfile = teacherProfileRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không tìm thấy hồ sơ giáo viên."));

            ClassEntity classEntity = classRepository.findByTeacherId(teacherProfile.getId())
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Giáo viên chưa được phân công lớp chủ nhiệm."));

            StudentProfile studentProfile = studentProfileRepository.findByUserId(targetUser.getId())
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy hồ sơ học sinh chờ duyệt."));

            if (!studentProfile.getClassEntity().getId().equals(classEntity.getId())) {
                throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Học sinh không thuộc lớp chủ nhiệm của bạn.");
            }
        } else {
            throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không có quyền thực hiện hành động này.");
        }
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getGoogleEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole().name())
                .approvalStatus(user.getApprovalStatus().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
