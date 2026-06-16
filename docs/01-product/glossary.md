# Glossary: Product Terminology

This glossary defines the standard terminology used throughout the ClassManager system. It maps Vietnamese terms from the original SRS to their English equivalents used in the codebase and documentation to maintain absolute consistency.

---

## 1. Domain Terminology Mapping

| Vietnamese Term | English Term | Database Mapping | Definition |
|:---|:---|:---|:---|
| **Hệ thống** | System | - | The global software deployment instance. |
| **Trường học** | School | `schools` | A high-level organizational tenant. Data from different schools is isolated. |
| **Năm học** | School Year | `school_years` | A calendar period of study. Each school has independent school years. |
| **Lớp học** | Class | `classes` | A single learning group belonging to a school and a grade (10, 11, or 12). |
| **Tổ** | Group | `groups` | A sub-unit within a class. Students belong to at most one group. |
| **Giáo viên chủ nhiệm**| Homeroom Teacher | `teacher_profiles` | The user in charge of managing a specific class, grading, and approvals. |
| **Học sinh** | Student | `student_profiles` | A pupil registered in a specific class. |
| **Tổ trưởng** | Group Leader | `groups.leader_student_id` | An organizational position assigned to a student who has the authority to grade group peers. |
| **Thực thể người dùng** | User | `users` | The root credential account containing auth data (email/phone). |
| **Trạng thái tài khoản** | Approval Status | `users.approval_status` | Lifecycle stage of an account: `PENDING`, `APPROVED`, or `REJECTED`. |
| **Điểm cơ bản** | Base Point | `school_years.base_point` | The starting points awarded to a student at the beginning of a school year. |
| **Log điểm / Nhật ký điểm**| Point Log | `point_logs` | An immutable record of a point reward or penalty for a student. |
| **Chốt điểm tuần** | Weekly Lock | `weekly_reports.is_locked` | The action or status indicating that points for a week can no longer be edited. |
| **Mẫu form động** | Form Template | `form_templates` | A version-controlled schema defining profile details to collect from students. |
| **Lý lịch học sinh** | Dynamic Profile | `student_profiles.dynamic_profile`| A student's answers to the active dynamic form template, stored as JSONB. |
| **Nhật ký giám sát** | Audit Log | `audit_logs` | Security records capturing sensitive administrative actions for compliance. |

---

## 2. Status & Enum Definitions

### `approval_status` (User Account Status)
- **`PENDING`**: Account is registered but not yet active. Cannot access resources.
- **`APPROVED`**: Account is verified by an admin/teacher and has active access.
- **`REJECTED`**: Account is rejected. Access is forbidden.

### `school_years.status`
- **`ACTIVE`**: The current, ongoing school year. Points can be added.
- **`ENDED`**: A finished school year. All child data (points, reports) is read-only.

### `student_profiles.status`
- **`STUDYING`**: The student is active in their assigned class.
- **`GRADUATED`**: The student completed grade 12 and is archived.

### `weekly_reports.locked_by`
- **`CRON`**: Locked automatically by the system cron scheduler at the end of the week.
- **`TEACHER`**: Locked manually by the homeroom teacher.
