package com.classmanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRegisterRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 100, message = "Họ và tên không quá 100 ký tự")
    private String fullName;

    private String googleIdToken;

    private String email; // Tùy chọn (dùng khi đăng ký bằng SĐT muốn liên kết email trước)

    private String phoneNumber;

    private String otpCode;

    @NotBlank(message = "Vai trò không được để trống")
    @Pattern(regexp = "TEACHER|STUDENT", message = "Vai trò phải là TEACHER hoặc STUDENT")
    private String role;

    private Integer classId; // Bắt buộc cho STUDENT
}
