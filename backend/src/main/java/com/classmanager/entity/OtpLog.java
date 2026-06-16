package com.classmanager.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "otp_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "phone_number", nullable = false, length = 15)
    private String phoneNumber;

    @Column(name = "otp_hash", nullable = false, length = 60)
    private String otpHash;

    @Column(name = "purpose", nullable = false, length = 20)
    private String purpose;

    @Column(name = "is_used", nullable = false)
    private Boolean isUsed;

    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        if (isUsed == null) isUsed = false;
        if (attemptCount == null) attemptCount = 0;
    }
}
