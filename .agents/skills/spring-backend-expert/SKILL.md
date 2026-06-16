---
name: spring-backend-expert
description: Huấn luyện Agent viết REST API Spring Boot 3.x cho ClassManager — tuân thủ Clean Architecture, immutable audit log, JWT auth và phân quyền RBAC 4 role.
---

# Mục tiêu
Đảm bảo toàn bộ Backend ClassManager được viết đúng kiến trúc, không vi phạm Business Rules bất biến (đặc biệt immutable point_logs), bảo mật theo từng role và nhất quán error response.

---

## Quy trình Thực hiện (Instructions)

### 1. Kiểm tra Ngữ cảnh
- Mọi class Java phải nằm trong `backend/src/main/java/com/classmanager/`
- Đọc `docs/srs/classmanager_srs_full.md` và `docs/schema.sql` trước khi viết bất kỳ logic nào
- Đọc `CLAUDE.md` để nắm Business Rules bắt buộc

### 2. Quy tắc Kiến trúc & Cấu trúc dự án (KHÔNG được vi phạm)

**Cấu trúc Package chuẩn:**
Tất cả các class Java mới phải được tổ chức đúng thư mục quy định tại `backend/src/main/java/com/classmanager/`:
- `config/`: Cấu hình hệ thống (Security, Database, CORS, JWT...).
- `controller/`: Các Restful Controllers nhận request, validate và ủy quyền cho Service.
- `service/`: Chứa interface & logic nghiệp vụ lõi, xử lý transaction.
- `repository/`: Các repository mở rộng Spring Data JPA để truy xuất dữ liệu.
- `entity/`: Các lớp ánh xạ bảng cơ sở dữ liệu.
- `dto/`: Chứa các lớp truyền tải dữ liệu:
  - `dto/request/`: Các request payload.
  - `dto/response/`: Các response payload.
- `exception/`: Các lớp định nghĩa ngoại lệ tùy chỉnh và `GlobalExceptionHandler`.
- `scheduler/`: Các tác vụ tự động hóa và lập lịch (Cron Job).

**Quy trình viết một Feature mới ở Backend (Backend Feature Flow):**
Khi tạo một tính năng mới, tuân thủ đúng trình tự phát triển sau:
1. **Entity**: Khai báo/cập nhật JPA Entity trong package `entity`.
2. **Repository**: Tạo interface JPA Repository trong package `repository`. Sử dụng `@EntityGraph` hoặc Join Fetch nếu cần tránh lỗi N+1.
3. **Service & Transaction**: Tạo Service trong package `service`, định nghĩa logic nghiệp vụ, xử lý transaction. Sử dụng `@Transactional(readOnly = true)` cho truy vấn và `@Transactional` cho chỉnh sửa.
4. **Audit Logging Integration**: Nếu feature nằm trong danh sách các hành động cần Audit (BR-AUDIT-02), viết tích hợp cơ chế ghi log thông qua JPA Entity Listeners hoặc gọi `AuditLogService` đồng bộ trong Transaction.
5. **DTOs & Validation**: Viết Request/Response DTOs trong package `dto`, khai báo Bean Validation `@NotNull`, `@NotBlank`, `@Size`, `@Pattern`, `@Min`, `@Max`.
6. **Controller**: Tạo Controller trong package `controller`, ánh xạ request qua `@Valid`, gán quyền truy cập với `@PreAuthorize`.
7. **Verify**: Biên dịch và chạy thử kiểm nghiệm bằng Gradle.

**Quy chuẩn các Layer:**
**Controller layer:**
- Dùng `@RestController` + `@RequestMapping("/api/v1/...")`
- KHÔNG chứa business logic — chỉ nhận request, gọi Service, trả response
- KHÔNG inject Repository trực tiếp vào Controller
- Prefix endpoint theo role: `/api/v1/admin/`, `/api/v1/teacher/`, `/api/v1/leader/`, `/api/v1/student/`

**Service layer:**
- Toàn bộ business logic và `@Transactional` đặt tại đây
- KHÔNG inject Service khác vòng tròn (circular dependency)
- Throw custom exception — KHÔNG return null

**Repository layer:**
- Dùng Spring Data JPA
- Với query phức tạp (join nhiều bảng): dùng `@Query` với JPQL hoặc `@EntityGraph` để tránh N+1
- KHÔNG dùng native query với input người dùng (SQL Injection)

**DTO layer:**
- Tách `Request DTO` và `Response DTO` — KHÔNG expose Entity ra ngoài API
- Dùng Lombok: `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`
- Validate Request DTO bằng Bean Validation: `@NotNull`, `@NotBlank`, `@Size`, `@Pattern`

### 3. Business Rules Bắt buộc

**Immutable Point Log (BR-POINT-01, BR-POINT-08):**
```java
// ✅ ĐÚNG — chỉ INSERT
pointLogRepository.save(new PointLog(...));

// ❌ SAI — tuyệt đối không làm
student.setTotalPoint(student.getTotalPoint() + value);
studentRepository.save(student);
```

**Tính điểm hiện tại:**
```java
// Luôn tính từ point_logs, không lưu cached total
int currentPoint = schoolYear.getBasePoint()
    + pointLogRepository.sumByStudentAndYear(studentId, schoolYearId);
```

**Kiểm tra tuần locked trước khi chấm điểm:**
```java
if (weeklyReportRepository.isLocked(studentId, weekStartDate)) {
    throw new WeekAlreadyLockedException("Tuần này đã được chốt điểm");
}
```

**Kiểm tra Tổ trưởng chỉ chấm trong tổ:**
```java
if (!student.getGroupId().equals(leader.getGroupId())) {
    throw new StudentNotInGroupException("Học sinh không thuộc tổ của bạn");
}
```

### 4. Auth & Phân quyền
- Dùng `@PreAuthorize("hasRole('TEACHER')")` hoặc custom `@SecurityRequirement`
- JWT payload phải chứa: `sub`, `role`, `classId`, `groupId`, `schoolYearId`
- Refresh Token lưu HttpOnly Cookie — KHÔNG trả trong response body
- OTP lưu dạng BCrypt hash — KHÔNG lưu plain text

### 5. Error Response (Bắt buộc thống nhất)
```java
// GlobalExceptionHandler phải trả đúng format này
{
  "timestamp": "2025-09-01T10:00:00+07:00",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "details": [{"field": "pointValue", "message": "Điểm phải khác 0"}],
  "path": "/api/v1/leader/points"
}
```

### 6. Audit Logging (BR-AUDIT-01, BR-AUDIT-02, BR-AUDIT-03)
- Bất kỳ hành động quản trị nhạy cảm nào dưới đây (BR-AUDIT-02) bắt buộc phải ghi Audit Log vào bảng `audit_logs` đồng bộ trong cùng một transaction:
  1. Duyệt/Từ chối giáo viên đăng ký (`APPROVE_TEACHER`, `REJECT_TEACHER`)
  2. Duyệt/Từ chối học sinh đăng ký (`APPROVE_STUDENT`, `REJECT_STUDENT`)
  3. Bổ nhiệm tổ trưởng (`ASSIGN_LEADER`)
  4. Chuyển tổ học sinh (`TRANSFER_STUDENT_GROUP`)
  5. Kích hoạt mẫu form động (`ACTIVATE_FORM_TEMPLATE`)
  6. Khóa điểm tuần thủ công/tự động (`WEEKLY_LOCK_MANUAL`, `WEEKLY_LOCK_AUTO`)
  7. Đóng năm học (`END_SCHOOL_YEAR`)
- Cách thực hiện: Gọi `AuditLogService.logAction(...)` trong Service, hoặc dùng JPA Entity Listeners `@EntityListeners` để tự động chụp trạng thái `old_value` và `new_value` dưới dạng JSONB.
- **Cấm tuyệt đối** việc cung cấp bất kỳ API nào cho phép `UPDATE` hoặc `DELETE` bản ghi trong bảng `audit_logs`. Bảng này chỉ được phép `INSERT`.

### 7. Cron Job
```java
@Scheduled(cron = "59 23 * * 0", zone = "Asia/Ho_Chi_Minh")
@Transactional
public void weeklyLockJob() {
    // 1. Kiểm tra is_locked trước — bỏ qua nếu đã lock
    // 2. Tính snapshot điểm từng học sinh
    // 3. Tính rank_in_class và rank_in_group
    // 4. Lưu weekly_report với locked_by = 'CRON'
    // Log đầy đủ: bắt đầu, kết thúc, số bản ghi
}
```

### 8. ENV & Cấu hình

**Quy tắc bắt buộc:**
- KHÔNG hardcode bất kỳ URL, secret, credentials nào trong code
- Mọi giá trị nhạy cảm đọc từ ENV qua `${ENV_VAR}` trong `application.yml`
- File `.env` KHÔNG được commit lên Git — chỉ commit `.env.example`


**`application.yml` đọc từ ENV:**
```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
  hikari:
    maximum-pool-size: 15
    minimum-idle: 3

app:
  jwt:
    secret: ${JWT_SECRET}
    expiration-ms: ${JWT_EXPIRATION_MS:7200000}
    refresh-expiration-ms: ${JWT_REFRESH_EXPIRATION_MS:604800000}
  google:
    client-id: ${GOOGLE_CLIENT_ID}
  cors:
    allowed-origins: ${ALLOWED_ORIGINS}
  admin:
    allowed-emails: ${ADMIN_ALLOWED_EMAILS}
  timezone: ${APP_TIMEZONE:Asia/Ho_Chi_Minh}
  sms:
    api-key: ${SMS_API_KEY}
    sender: ${SMS_SENDER:ClassManager}
```

**Khi deploy lên Koyeb:**
- Set toàn bộ biến ENV qua Koyeb Dashboard → Service → Environment
- Đổi `ALLOWED_ORIGINS` thành Vercel domain thật
- Đổi `SPRING_PROFILES_ACTIVE=prod`

### 9. CORS
- Cho phép origin từ ENV `ALLOWED_ORIGINS` (không hardcode)
- Dev: `http://localhost:5173`
- Production: Vercel domain

---

## Quy trình Kiểm tra (Verification Workflow)

Sau mỗi lần tạo hoặc sửa code Java:

```bash
# Bước 1: Di chuyển vào backend
cd backend

# Bước 2: Compile kiểm tra lỗi
./gradlew compileJava

# Bước 3: Chạy test liên quan (nếu có)
./gradlew test --tests "TênClassTest"

# Bước 4: Chỉ tạo Artifact Walkthrough khi compile SUCCESS
```

---

## Anti-patterns Cần Tránh

```
❌ UPDATE trực tiếp điểm học sinh
❌ Expose Entity ra ngoài API (không qua DTO)
❌ Business logic trong Controller
❌ @Transactional trong Controller
❌ Inject Repository vào Controller
❌ Dùng // TODO, // ..., placeholder — viết đầy đủ
❌ Hardcode secret, URL, credentials — luôn dùng ${ENV_VAR} trong application.yml
❌ Commit file .env lên Git — chỉ commit .env.example
❌ Native query với input người dùng
❌ Tạo SchoolYear thứ 2 khi đã có ACTIVE
```