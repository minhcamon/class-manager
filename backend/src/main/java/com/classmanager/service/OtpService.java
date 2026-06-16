package com.classmanager.service;

import com.classmanager.entity.OtpLog;
import com.classmanager.repository.OtpLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpLogRepository otpLogRepository;
    private final SmsService smsService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final Random random = new Random();

    @Transactional
    public String sendOtp(String phoneNumber, String purpose) {
        // 1. Sinh mã OTP 6 chữ số
        String otp = String.format("%06d", random.nextInt(1000000));
        String message = "Ma OTP ClassManager cua ban la: " + otp + ". Co hieu luc trong 5 phut.";

        // 2. Lưu OTP Log (BCrypt hash) vào database
        String otpHash = passwordEncoder.encode(otp);
        OtpLog otpLog = OtpLog.builder()
                .phoneNumber(phoneNumber)
                .otpHash(otpHash)
                .purpose(purpose)
                .isUsed(false)
                .attemptCount(0)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .build();
        otpLogRepository.save(otpLog);

        // 3. Gửi OTP qua SmsService
        smsService.sendSms(phoneNumber, message);

        // 4. Nếu là Mock/Dev mode (SmsService.isMock() = true), trả về otp để hiển thị ở UI
        if (smsService.isMock()) {
            log.info("[OTP Service] Chế độ MVP: Trả về mã OTP {} trong response API.", otp);
            return otp;
        }

        return null;
    }

    @Transactional
    public boolean verifyOtp(String phoneNumber, String otpInput) {
        OtpLog otpLog = otpLogRepository.findLatestUnused(phoneNumber, Instant.now())
                .orElse(null);

        if (otpLog == null) {
            log.warn("[OTP Verification] Không tìm thấy OTP hợp lệ cho số điện thoại: {}", phoneNumber);
            return false;
        }

        if (otpLog.getAttemptCount() >= 3) {
            log.warn("[OTP Verification] Nhập sai quá 3 lần cho số điện thoại: {}", phoneNumber);
            return false;
        }

        boolean matches = passwordEncoder.matches(otpInput, otpLog.getOtpHash());
        if (!matches) {
            otpLog.setAttemptCount(otpLog.getAttemptCount() + 1);
            otpLogRepository.save(otpLog);
            log.warn("[OTP Verification] Mã OTP nhập không chính xác cho số điện thoại: {}", phoneNumber);
            return false;
        }

        otpLog.setIsUsed(true);
        otpLogRepository.save(otpLog);
        log.info("[OTP Verification] Xác thực thành công cho số điện thoại: {}", phoneNumber);
        return true;
    }
}
