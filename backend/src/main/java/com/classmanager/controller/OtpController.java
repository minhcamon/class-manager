package com.classmanager.controller;

import com.classmanager.dto.response.SmsResponse;
import com.classmanager.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;

    @PostMapping("/send")
    public ResponseEntity<SmsResponse> sendOtp(
            @RequestParam String phoneNumber,
            @RequestParam(defaultValue = "REGISTER") String purpose) {
        
        String otp = otpService.sendOtp(phoneNumber, purpose);
        
        if (otp != null) {
            return ResponseEntity.ok(SmsResponse.builder()
                    .message("Gửi OTP thành công (Chế độ MVP - Giao diện hiển thị)")
                    .otp(otp)
                    .build());
        } else {
            return ResponseEntity.ok(SmsResponse.builder()
                    .message("Mã OTP đã được gửi qua SMS thành công.")
                    .build());
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<String> verifyOtp(
            @RequestParam String phoneNumber,
            @RequestParam String otp) {
        
        boolean verified = otpService.verifyOtp(phoneNumber, otp);
        if (verified) {
            return ResponseEntity.ok("Xác thực OTP thành công.");
        } else {
            return ResponseEntity.badRequest().body("Mã OTP không đúng hoặc đã hết hạn/quá số lần nhập.");
        }
    }
}
