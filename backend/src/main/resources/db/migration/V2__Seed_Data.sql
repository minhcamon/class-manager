-- ===========================================
-- SEED DATA FOR CLASSMANAGER
-- ===========================================

-- 1. Seed an Approved Teacher User to own classes
INSERT INTO users (id, full_name, google_email, phone_number, phone_verified, role, approval_status, approved_at) VALUES
(1, 'Giáo Viên Hệ Thống', 'system.teacher@gmail.com', '0999999999', true, 'TEACHER', 'APPROVED', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Reset users sequence
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(max(id), 1)) FROM users;

-- 2. Seed Teacher Profile
INSERT INTO teacher_profiles (id, user_id) VALUES
(1, 1)
ON CONFLICT (id) DO NOTHING;

-- Reset teacher_profiles sequence
SELECT setval(pg_get_serial_sequence('teacher_profiles', 'id'), COALESCE(max(id), 1)) FROM teacher_profiles;

-- 3. Seed Classes assigned to Teacher 1
INSERT INTO classes (id, class_name, grade, teacher_id, status, base_point) VALUES
(1, '10A1', 10, 1, 'ACTIVE', 100),
(2, '11A1', 11, 1, 'ENDED', 100),
(3, '12A1', 12, 1, 'ENDED', 100)
ON CONFLICT (id) DO NOTHING;

-- Reset classes sequence
SELECT setval(pg_get_serial_sequence('classes', 'id'), COALESCE(max(id), 1)) FROM classes;
