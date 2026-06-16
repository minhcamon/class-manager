---
name: postgresql-transactions
description: Guide for writing Java/Spring Boot code that ensures PostgreSQL data integrity for ClassManager — focusing on immutable audit logs, weekly points lock cron jobs, and concurrency handling.
---

# Objective
Ensure all critical write operations in ClassManager (point_logs, weekly_reports, OTP) run within proper transactions, preventing race conditions and avoiding data loss in case of mid-process failures.

---

## Instructions

### 1. Basic Transaction Rules

**Place @Transactional in the correct layer:**
```java
// ✅ CORRECT — @Transactional at the Service layer
@Service
public class PointLogService {
    @Transactional
    public PointLogResponse addPointLog(CreatePointLogRequest request) {
        validateWeekNotLocked(request.getWeekStartDate());
        validateStudentInGroup(request.getStudentId());
        PointLog log = pointLogRepository.save(buildPointLog(request));
        return PointLogResponse.from(log);
    }
}

// ❌ INCORRECT — @Transactional at the Controller layer
@RestController
public class PointController {
    @Transactional  // Do not place here
    @PostMapping
    public ResponseEntity<?> addPoint(...) { ... }
}
```

**Read-only transactions for queries:**
```java
@Transactional(readOnly = true)
public List<StudentResponse> getStudentsByClass(Integer classId) {
    return studentRepository.findByClassId(classId)
        .stream().map(StudentResponse::from).toList();
}
```

---

### 2. Immutable Point Log (BR-POINT-01, BR-POINT-08)

```java
// ✅ CORRECT — INSERT only
@Transactional
public void addPoint(Integer studentId, Integer value, String reason) {
    LocalDate weekStart = getCurrentWeekStart();
    if (weeklyReportRepository.isLocked(studentId, weekStart)) {
        throw new WeekAlreadyLockedException();
    }
    pointLogRepository.save(PointLog.builder()
        .studentId(studentId)
        .pointValue(value)
        .reason(reason)
        .weekStartDate(weekStart)
        .createdAt(Instant.now())
        .build());
}

// ✅ CORRECT — adjustment via offset record
@Transactional
public void reversePoint(Long originalLogId, String reason) {
    PointLog original = pointLogRepository.findById(originalLogId)
        .orElseThrow(NotFoundException::new);
    pointLogRepository.save(PointLog.builder()
        .studentId(original.getStudentId())
        .pointValue(-original.getPointValue())  // invert sign
        .reason("Reversal: " + reason)
        .weekStartDate(original.getWeekStartDate())
        .createdAt(Instant.now())
        .build());
}

// ❌ NEVER do the following
student.setTotalPoint(student.getTotalPoint() + value);
pointLogRepository.deleteById(id);
pointLogRepository.updatePointValue(id, newValue);
```

**Calculate current points — always compute from logs:**
```java
// ✅ CORRECT
@Query("""
    SELECT sy.basePoint + COALESCE(SUM(pl.pointValue), 0)
    FROM PointLog pl
    JOIN SchoolYear sy ON pl.schoolYearId = sy.id
    WHERE pl.studentId = :studentId
    AND pl.schoolYearId = :schoolYearId
    """)
Integer calculateCurrentPoint(
    @Param("studentId") Integer studentId,
    @Param("schoolYearId") Integer schoolYearId
);

// ❌ INCORRECT — do not read cached total
return student.getTotalPoint();
```

---

### 3. Weekly Point Lock Cron Job (BR-WEEK-01 to BR-WEEK-04)

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class WeeklyLockScheduler {

    private final WeeklyReportService weeklyReportService;

    @Scheduled(cron = "0 59 23 * * SUN", zone = "Asia/Ho_Chi_Minh")
    public void lockWeeklyPoints() {
        log.info("[CRON] Starting weekly point locking - {}", LocalDateTime.now());
        try {
            int count = weeklyReportService.lockCurrentWeek("CRON");
            log.info("[CRON] Completed - locked {} students", count);
        } catch (Exception e) {
            log.error("[CRON] Error locking points: {}", e.getMessage(), e);
            // DO NOT re-throw — let the Cron Job continue next time
        }
    }
}

@Service
@RequiredArgsConstructor
public class WeeklyReportService {

    @Transactional
    public int lockCurrentWeek(String lockedBy) {
        LocalDate weekStart = getLastMonday();
        LocalDate weekEnd = weekStart.plusDays(6);

        // BR-WEEK-03: skip if already locked manually
        if (weeklyReportRepository.existsByWeekStartAndLocked(weekStart)) {
            log.info("[CRON] Week {} was already locked", weekStart);
            return 0;
        }

        List<Student> students = studentRepository.findAllActive();
        List<WeeklyReport> reports = new ArrayList<>();

        for (Student student : students) {
            // BR-WEEK-04: snapshot at lock time
            int snapshot = pointLogRepository
                .calculateCurrentPoint(student.getId(), getCurrentSchoolYearId());

            reports.add(WeeklyReport.builder()
                .studentId(student.getId())
                .weekStartDate(weekStart)
                .weekEndDate(weekEnd)
                .snapshotPoint(snapshot)
                .isLocked(true)
                .lockedAt(Instant.now())
                .lockedBy(lockedBy)
                .build());
        }

        // Batch insert — do not call save() in a loop
        weeklyReportRepository.saveAll(reports);
        calculateAndSaveRanks(reports, weekStart);
        return reports.size();
    }

    private LocalDate getLastMonday() {
        return LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))
            .with(DayOfWeek.MONDAY);
    }
}
```

---

### 4. Avoiding N+1 Queries

```java
// ❌ INCORRECT — N+1
List<Student> students = studentRepository.findAll();
students.forEach(s -> {
    int point = pointLogRepository.calculateCurrentPoint(s.getId(), yearId);
    response.add(new StudentWithPoint(s, point));
});

// ✅ CORRECT — a single query
@Query("""
    SELECT s.id as studentId, s.fullName,
           sy.basePoint + COALESCE(SUM(pl.pointValue), 0) as currentPoint
    FROM Student s
    JOIN SchoolYear sy ON sy.id = :schoolYearId
    LEFT JOIN PointLog pl ON pl.studentId = s.id
        AND pl.schoolYearId = :schoolYearId
    WHERE s.classId = :classId
    GROUP BY s.id, s.fullName, sy.basePoint
    ORDER BY currentPoint DESC
    """)
List<StudentPointProjection> findStudentsWithPoints(
    @Param("classId") Integer classId,
    @Param("schoolYearId") Integer schoolYearId
);

// Interface Projection — select only necessary fields
public interface StudentPointProjection {
    Integer getStudentId();
    String getFullName();
    Integer getCurrentPoint();
}
```

---

### 5. Race Condition — Concurrent Lock

```java
// UNIQUE constraint in the DB is the first safety net
// UNIQUE (student_id, week_start_date) in weekly_reports

// Catch duplicates gracefully
@Transactional
public int lockCurrentWeek(String lockedBy) {
    try {
        // ... lock logic
        weeklyReportRepository.saveAll(reports);
    } catch (DataIntegrityViolationException e) {
        log.warn("[CRON] Week already locked by another thread, skipping");
        return 0;
    }
}
```

---

### 6. OTP — Expiry & Limits Handling

```java
@Transactional
public void verifyOtp(String phoneNumber, String otpInput) {
    OtpLog otp = otpLogRepository.findLatestUnused(phoneNumber)
        .orElseThrow(() -> new OtpNotFoundException("OTP code does not exist"));

    // Check expiry
    if (Instant.now().isAfter(otp.getExpiresAt())) {
        throw new OtpExpiredException("OTP code has expired");
    }

    // Check invalid attempts (BR-LINK-03: maximum 3 times)
    if (otp.getAttemptCount() >= 3) {
        throw new OtpLockedException("Invalid entry exceeded 3 times");
    }

    // Verify using BCrypt — DO NOT compare plain text
    if (!passwordEncoder.matches(otpInput, otp.getOtpHash())) {
        otp.setAttemptCount(otp.getAttemptCount() + 1);
        otpLogRepository.save(otp);
        throw new OtpInvalidException("Incorrect OTP code");
    }

    // Mark as used within the same transaction
    otp.setIsUsed(true);
    otpLogRepository.save(otp);
}

// Rate limit (BR-LINK-09: 5 times/phone number/day)
@Transactional(readOnly = true)
public void checkOtpRateLimit(String phoneNumber) {
    LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    int count = otpLogRepository.countTodayByPhone(phoneNumber, today);
    if (count >= 5) {
        throw new OtpRateLimitException("OTP sent more than 5 times today");
    }
}
```

---

### 7. School Year Freeze (BR-YEAR-02)

```java
// Call at the beginning of every data-writing service method
@Transactional(readOnly = true)
public void assertSchoolYearActive(Integer schoolYearId) {
    SchoolYear sy = schoolYearRepository.findById(schoolYearId)
        .orElseThrow(NotFoundException::new);
    if ("ENDED".equals(sy.getStatus())) {
        throw new SchoolYearEndedException(
            "School year has ended — cannot add new data"
        );
    }
}

@Transactional
public PointLogResponse addPointLog(CreatePointLogRequest req) {
    assertSchoolYearActive(req.getSchoolYearId()); // check first
    // ... subsequent logic
}
```

---

### 8. Transactional Audit Logging (Ensuring Audit Trail Integrity)

- Any sensitive administrative action (BR-AUDIT-02) requiring an audit log entry in `audit_logs` must be executed within the same transaction (`@Transactional`) as the main business operation.
- If either the main database update or the audit log write fails, the entire process must be rolled back automatically.

```java
// ✅ CORRECT — Write Audit Log and update status simultaneously within the same transaction
@Transactional
public void approveStudent(Integer studentProfileId, Integer actorUserId) {
    StudentProfile student = studentProfileRepository.findById(studentProfileId)
        .orElseThrow(NotFoundException::new);
    
    // Save old state
    String oldValueJson = "{\"approvalStatus\":\"PENDING\"}";
    
    // Perform mutation
    student.getUser().setApprovalStatus(ApprovalStatus.APPROVED);
    student.getUser().setApprovedAt(Instant.now());
    studentProfileRepository.save(student);
    
    // Save new state
    String newValueJson = String.format(
        "{\"approvalStatus\":\"APPROVED\",\"approvedAt\":\"%s\"}", 
        student.getUser().getApprovedAt()
    );
    
    // Write audit log
    auditLogRepository.save(AuditLog.builder()
        .actorUserId(actorUserId)
        .action("APPROVE_STUDENT")
        .entityName("users")
        .entityId(student.getUser().getId())
        .oldValue(oldValueJson)
        .newValue(newValueJson)
        .createdAt(Instant.now())
        .build());
}
```

---

## Verification Workflow

```bash
# Run transaction tests
cd backend
./gradlew test --tests "*TransactionTest" --tests "*SchedulerTest"

# Enable SQL logging to detect N+1
# application-test.yml:
# spring.jpa.show-sql: true
# spring.jpa.properties.hibernate.format_sql: true

# Compile
./gradlew compileJava
```

---

## Anti-patterns to Avoid

```
❌ UPDATE or DELETE an already created point_log
❌ Read cached total points from the student entity
❌ @Transactional in Controller or Repository
❌ save() individual entities in a loop — use saveAll()
❌ N+1 queries when fetching student list with points
❌ OTP plain text comparison — always use BCrypt
❌ Not checking is_locked before adding point_log
❌ Cron Job throwing exceptions out — must catch and log
❌ Not using Asia/Ho_Chi_Minh timezone when calculating dates
❌ Creating 2 ACTIVE SchoolYears simultaneously
```