-- ===========================================
-- HỆ THỐNG QUẢN LÝ LỚP CHỦ NHIỆM - POSTGRESQL SCHEMA (V1)
-- ===========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. NGƯỜI DÙNG GỐC (USERS)
CREATE TABLE users (
    id               SERIAL PRIMARY KEY,
    full_name        VARCHAR(100) NOT NULL,
    google_email     VARCHAR(100) UNIQUE,              -- NULL nếu chưa liên kết Google
    phone_number     VARCHAR(15)  UNIQUE,              -- NULL nếu chưa liên kết SĐT
    phone_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
    role             VARCHAR(20)  NOT NULL DEFAULT 'STUDENT'
                                  CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT')),
    approval_status  VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                                  CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    rejection_reason TEXT,
    approved_at      TIMESTAMP,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_auth CHECK (
        google_email IS NOT NULL OR (phone_number IS NOT NULL AND phone_verified = TRUE)
    )
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_approval ON users(approval_status);

-- 2. HỒ SƠ GIÁO VIÊN (TEACHER PROFILES)
CREATE TABLE teacher_profiles (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. LỚP HỌC (CLASSES)
CREATE TABLE classes (
    id             SERIAL PRIMARY KEY,
    class_name     VARCHAR(10) NOT NULL,              -- Ví dụ: "10A1"
    grade          INT NOT NULL CHECK (grade BETWEEN 10 AND 12),
    teacher_id     INT NOT NULL REFERENCES teacher_profiles(id),
    status         VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE'
                                CHECK (status IN ('ACTIVE', 'ENDED')),
    base_point     INT          NOT NULL DEFAULT 100,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ràng buộc: chỉ cho phép tối đa 1 lớp học ACTIVE cho mỗi giáo viên chủ nhiệm
CREATE UNIQUE INDEX uq_class_active_per_teacher
    ON classes (teacher_id, status)
    WHERE status = 'ACTIVE';

-- 4. HỒ SƠ HỌC SINH (STUDENT PROFILES)
CREATE TABLE student_profiles (
    id               SERIAL PRIMARY KEY,
    user_id          INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    class_id         INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    group_id         INT,                              -- Được cập nhật sau khi phân tổ, tham chiếu chéo vòng tròn sẽ được khai báo sau
    dynamic_profile  JSONB DEFAULT '{}',               -- Lưu câu trả lời của form lý lịch
    status           VARCHAR(20) NOT NULL DEFAULT 'STUDYING'
                                 CHECK (status IN ('STUDYING', 'GRADUATED')),
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_class ON student_profiles(class_id);

-- 5. TỔ (GROUPS)
CREATE TABLE groups (
    id                 SERIAL PRIMARY KEY,
    class_id           INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    group_name         VARCHAR(50) NOT NULL,           -- Ví dụ: "Tổ 1"
    leader_student_id  INT REFERENCES student_profiles(id) ON DELETE SET NULL, -- Lưu trữ position Tổ trưởng
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (class_id, group_name)
);

-- Thêm khóa ngoại cho student_profiles.group_id để tránh lỗi lúc khởi tạo tuần tự
ALTER TABLE student_profiles ADD CONSTRAINT fk_student_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;
CREATE INDEX idx_students_group ON student_profiles(group_id);

-- 6. NHẬT KÝ OTP (OTP LOGS)
CREATE TABLE IF NOT EXISTS otp_logs (
    id            BIGSERIAL PRIMARY KEY,
    phone_number  VARCHAR(15) NOT NULL,
    otp_hash      VARCHAR(60) NOT NULL,                -- BCrypt hash của OTP 6 số
    purpose       VARCHAR(20) NOT NULL CHECK (purpose IN ('REGISTER', 'LINK_PHONE')),
    is_used       BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_count INT NOT NULL DEFAULT 0,
    expires_at    TIMESTAMP NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_logs(phone_number, is_used, expires_at);

-- 7. LOG ĐIỂM SỐ (POINT LOGS - IMMUTABLE)
CREATE TABLE point_logs (
    id                 BIGSERIAL PRIMARY KEY,
    student_id         INT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    class_id           INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_by_user_id INT NOT NULL REFERENCES users(id), -- Truy vết bất kỳ User nào thực hiện chấm
    point_value        INT NOT NULL CHECK (point_value <> 0),
    reason             TEXT NOT NULL,
    week_start_date    DATE NOT NULL,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_point_logs_student ON point_logs(student_id, class_id);
CREATE INDEX idx_point_logs_week ON point_logs(week_start_date);

-- 8. BÁO CÁO TUẦN (WEEKLY REPORTS)
CREATE TABLE weekly_reports (
    id                  BIGSERIAL PRIMARY KEY,
    student_id          INT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    class_id            INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    week_start_date     DATE NOT NULL,
    week_end_date       DATE NOT NULL,
    snapshot_point      INT NOT NULL,                  -- Tổng điểm tại thời điểm chốt
    snapshot_base_point INT NOT NULL,                  -- Điểm nền (base_point) tại thời điểm chốt
    total_bonus         INT NOT NULL DEFAULT 0,        -- Tổng điểm cộng trong tuần
    total_penalty       INT NOT NULL DEFAULT 0,        -- Tổng điểm trừ trong tuần
    rank_in_class       INT,
    rank_in_group       INT,
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at           TIMESTAMP,
    locked_by           VARCHAR(20) CHECK (locked_by IN ('CRON', 'TEACHER')),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, week_start_date)
);

CREATE INDEX idx_weekly_reports_student ON weekly_reports(student_id, class_id);
CREATE INDEX idx_weekly_reports_week ON weekly_reports(week_start_date, is_locked);

-- 9. FORM ĐỘNG (FORM TEMPLATES - VERSIONED)
CREATE TABLE form_templates (
    id          SERIAL PRIMARY KEY,
    class_id    INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    structure   JSONB NOT NULL DEFAULT '[]',           -- Cấu trúc JSON các trường
    version     INT NOT NULL DEFAULT 1,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (class_id, version)
);

CREATE UNIQUE INDEX uq_form_active_per_class
    ON form_templates (class_id)
    WHERE is_active = TRUE;

-- 10. LOG GIÁM SÁT HỆ THỐNG (AUDIT LOGS)
CREATE TABLE audit_logs (
    id             BIGSERIAL PRIMARY KEY,
    actor_user_id  INT REFERENCES users(id) ON DELETE SET NULL, -- Người thực hiện
    action         VARCHAR(50) NOT NULL,               -- Ví dụ: 'APPROVE_STUDENT', 'ASSIGN_LEADER'
    entity_name    VARCHAR(50) NOT NULL,               -- Ví dụ: 'student_profiles', 'groups'
    entity_id      INT NOT NULL,                       -- ID của bản ghi bị tác động
    old_value      JSONB,                              -- Giá trị cũ
    new_value      JSONB,                              -- Giá trị mới
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
