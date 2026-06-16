package com.classmanager.service;

import com.classmanager.entity.AuditLog;
import com.classmanager.entity.User;
import com.classmanager.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(User actor, String action, String entityName, Integer entityId, String oldValue, String newValue) {
        AuditLog auditLog = AuditLog.builder()
                .actor(actor)
                .action(action)
                .entityName(entityName)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .build();
        auditLogRepository.save(auditLog);
    }
}
