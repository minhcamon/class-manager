---
name: postgresql-transactions
description: Hướng dẫn Agent viết code Java/Spring Boot đảm bảo tính toàn vẹn dữ liệu PostgreSQL cho ClassManager — tập trung vào immutable audit log, Cron Job chốt điểm và xử lý concurrency.
---

# Mục tiêu
Đảm bảo mọi thao tác ghi dữ liệu quan trọng trong ClassManager (point_logs, weekly_reports, OTP) đều chạy trong transaction đúng, không bị race condition, không mất dữ liệu khi có lỗi giữa chừng.

---

## Quy trình Thực hiện (Instructions)

### 1. Nguyên tắc Transaction cơ bản

**Đặt @Transactional đúng chỗ:**
```java
// ✅ ĐÚNG — @Transactional ở Service layer
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

// ❌ SAI — @Transactional ở Controller
@RestController
public class PointController {
    @Transactional  // không đặt ở đây
    @PostMapping
    public ResponseEntity<?> addPoint(...) { ... }
}
```

**Read-only transaction cho query:**
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
// ✅ ĐÚNG — chỉ INSERT
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

// ✅ ĐÚNG — điều chỉnh bằng bản ghi đối trừ
@Transactional
public void reversePoint(Long originalLogId, String reason) {
    PointLog original = pointLogRepository.findById(originalLogId)
        .orElseThrow(NotFoundException::new);
    pointLogRepository.save(PointLog.builder()
        .studentId(original.getStudentId())
        .pointValue(-original.getPointValue())  // đảo dấu
        .reason("Hoàn trả: " + reason)
        .weekStartDate(original.getWeekStartDate())
        .createdAt(Instant.now())
        .build());
}

// ❌ TUYỆT ĐỐI KHÔNG làm
student.setTotalPoint(student.getTotalPoint() + value);
pointLogRepository.deleteById(id);
pointLogRepository.updatePointValue(id, newValue);
```

**Tính điểm hiện tại — luôn tính từ logs:**
```java
// ✅ ĐÚNG
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

// ❌ SAI — không đọc cached total
return student.getTotalPoint();
```

---

### 3. Cron Job Chốt Điểm Tuần (BR-WEEK-01 đến BR-WEEK-04)

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class WeeklyLockScheduler {

    private final WeeklyReportService weeklyReportService;

    @Scheduled(cron = "0 59 23 * * SUN", zone = "Asia/Ho_Chi_Minh")
    public void lockWeeklyPoints() {
        log.info("[CRON] Bắt đầu chốt điểm tuần - {}", LocalDateTime.now());
        try {
            int count = weeklyReportService.lockCurrentWeek("CRON");
            log.info("[CRON] Hoàn thành - đã chốt {} học sinh", count);
        } catch (Exception e) {
            log.error("[CRON] Lỗi khi chốt điểm: {}", e.getMessage(), e);
            // KHÔNG re-throw — để Cron Job tiếp tục lần sau
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

        // BR-WEEK-03: bỏ qua nếu đã lock thủ công
        if (weeklyReportRepository.existsByWeekStartAndLocked(weekStart)) {
            log.info("[CRON] Tuần {} đã được lock trước", weekStart);
            return 0;
        }

        List<Student> students = studentRepository.findAllActive();
        List<WeeklyReport> reports = new ArrayList<>();

        for (Student student : students) {
            // BR-WEEK-04: snapshot tại thời điểm chốt
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

        // Batch insert — không gọi save() từng cái trong vòng lặp
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

### 4. Tránh N+1 Query

```java
// ❌ SAI — N+1
List<Student> students = studentRepository.findAll();
students.forEach(s -> {
    int point = pointLogRepository.calculateCurrentPoint(s.getId(), yearId);
    response.add(new StudentWithPoint(s, point));
});

// ✅ ĐÚNG — 1 query duy nhất
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

// Interface Projection — chỉ lấy field cần thiết
public interface StudentPointProjection {
    Integer getStudentId();
    String getFullName();
    Integer getCurrentPoint();
}
```

---

### 5. Race Condition — Chốt điểm đồng thời

```java
// UNIQUE constraint trong DB là safety net đầu tiên
// UNIQUE (student_id, week_start_date) trong weekly_reports

// Bắt duplicate gracefully
@Transactional
public int lockCurrentWeek(String lockedBy) {
    try {
        // ... lock logic
        weeklyReportRepository.saveAll(reports);
    } catch (DataIntegrityViolationException e) {
        log.warn("[CRON] Tuần đã được lock bởi thread khác, bỏ qua");
        return 0;
    }
}
```

---

### 6. OTP — Xử lý hết hạn & giới hạn

```java
@Transactional
public void verifyOtp(String phoneNumber, String otpInput) {
    OtpLog otp = otpLogRepository.findLatestUnused(phoneNumber)
        .orElseThrow(() -> new OtpNotFoundException("Mã OTP không tồn tại"));

    // Kiểm tra hết hạn
    if (Instant.now().isAfter(otp.getExpiresAt())) {
        throw new OtpExpiredException("Mã OTP đã hết hạn");
    }

    // Kiểm tra số lần sai (BR-LINK-03: tối đa 3 lần)
    if (otp.getAttemptCount() >= 3) {
        throw new OtpLockedException("Đã nhập sai quá 3 lần");
    }

    // Verify bằng BCrypt — KHÔNG so sánh plain text
    if (!passwordEncoder.matches(otpInput, otp.getOtpHash())) {
        otp.setAttemptCount(otp.getAttemptCount() + 1);
        otpLogRepository.save(otp);
        throw new OtpInvalidException("Mã OTP không đúng");
    }

    // Mark as used trong cùng transaction
    otp.setIsUsed(true);
    otpLogRepository.save(otp);
}

// Rate limit (BR-LINK-09: 5 lần/SĐT/ngày)
@Transactional(readOnly = true)
public void checkOtpRateLimit(String phoneNumber) {
    LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    int count = otpLogRepository.countTodayByPhone(phoneNumber, today);
    if (count >= 5) {
        throw new OtpRateLimitException("Đã gửi OTP quá 5 lần hôm nay");
    }
}
```

---

### 7. School Year Freeze (BR-YEAR-02)

```java
// Gọi ở đầu mọi service method có ghi dữ liệu
@Transactional(readOnly = true)
public void assertSchoolYearActive(Integer schoolYearId) {
    SchoolYear sy = schoolYearRepository.findById(schoolYearId)
        .orElseThrow(NotFoundException::new);
    if ("ENDED".equals(sy.getStatus())) {
        throw new SchoolYearEndedException(
            "Năm học đã kết thúc — không thể thêm dữ liệu mới"
        );
    }
}

@Transactional
public PointLogResponse addPointLog(CreatePointLogRequest req) {
    assertSchoolYearActive(req.getSchoolYearId()); // kiểm tra đầu tiên
    // ... logic tiếp theo
}
```

---

### 8. Transactional Audit Logging (Đảm bảo tính toàn vẹn của Audit Trail)

- Bất kỳ hành động quản trị nhạy cảm nào (BR-AUDIT-02) yêu cầu ghi log vào `audit_logs` phải được thực thi trong cùng một transaction (`@Transactional`) với thao tác nghiệp vụ chính. 
- Nếu thao tác cập nhật cơ sở dữ liệu chính hoặc thao tác ghi audit log thất bại, toàn bộ quá trình phải được rollback tự động.

```java
// ✅ ĐÚNG — Ghi Audit Log và cập nhật trạng thái đồng thời trong cùng một transaction
@Transactional
public void approveStudent(Integer studentProfileId, Integer actorUserId) {
    StudentProfile student = studentProfileRepository.findById(studentProfileId)
        .orElseThrow(NotFoundException::new);
    
    // Lưu lại trạng thái cũ
    String oldValueJson = "{\"approvalStatus\":\"PENDING\"}";
    
    // Thực hiện mutation
    student.getUser().setApprovalStatus(ApprovalStatus.APPROVED);
    student.getUser().setApprovedAt(Instant.now());
    studentProfileRepository.save(student);
    
    // Lưu lại trạng thái mới
    String newValueJson = String.format(
        "{\"approvalStatus\":\"APPROVED\",\"approvedAt\":\"%s\"}", 
        student.getUser().getApprovedAt()
    );
    
    // Ghi audit log
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

## Quy trình Kiểm tra (Verification Workflow)

```bash
# Chạy test transaction
cd backend
./gradlew test --tests "*TransactionTest" --tests "*SchedulerTest"

# Bật SQL logging để phát hiện N+1
# application-test.yml:
# spring.jpa.show-sql: true
# spring.jpa.properties.hibernate.format_sql: true

# Compile
./gradlew compileJava
```

---

## Anti-patterns Cần Tránh

```
❌ UPDATE hoặc DELETE point_log đã tạo
❌ Đọc cached total điểm từ student entity
❌ @Transactional ở Controller hoặc Repository
❌ save() từng entity trong vòng lặp — dùng saveAll()
❌ N+1 query khi lấy danh sách học sinh kèm điểm
❌ So sánh OTP plain text — luôn dùng BCrypt
❌ Không kiểm tra is_locked trước khi thêm point_log
❌ Cron Job throw exception ra ngoài — phải catch và log
❌ Không dùng timezone Asia/Ho_Chi_Minh khi tính ngày
❌ Tạo 2 SchoolYear ACTIVE cùng lúc
```