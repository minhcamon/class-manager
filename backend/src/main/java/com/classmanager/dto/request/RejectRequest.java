package com.classmanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectRequest {

    @NotBlank(message = "Lý do từ chối không được để trống")
    @Size(min = 5, max = 500, message = "Lý do phải từ 5 đến 500 ký tự")
    private String reason;
}
