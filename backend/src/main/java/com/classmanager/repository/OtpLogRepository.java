package com.classmanager.repository;

import com.classmanager.entity.OtpLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface OtpLogRepository extends JpaRepository<OtpLog, Long> {
    
    @Query("SELECT o FROM OtpLog o WHERE o.phoneNumber = :phone AND o.isUsed = false AND o.expiresAt > :now ORDER BY o.createdAt DESC LIMIT 1")
    Optional<OtpLog> findLatestUnused(@Param("phone") String phoneNumber, @Param("now") Instant now);
}
