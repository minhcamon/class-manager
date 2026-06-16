# Business Rules

This document consolidates all business rules (`BR-*`) extracted from the ClassManager SRS. All developers and AI coding agents must ensure code changes do not violate these invariants.

---

## 1. Authentication & Account Management (Auth)

### BR-AUTH-01: Credentials Requirements
- Every account in the `users` table must register using either:
  1. A Google account (`google_email` is not null).
  2. A verified Phone Number (`phone_number` is not null and `phone_verified = true`).
- **DB Constraint**: `CONSTRAINT chk_user_auth CHECK (google_email IS NOT NULL OR (phone_number IS NOT NULL AND phone_verified = TRUE))`

### BR-AUTH-02: Access Lifecycle Restrictions
- Accounts are created with `approval_status = 'PENDING'`.
- Users with `PENDING` or `REJECTED` status are blocked from all secured resources.
- API requests by restricted users must return HTTP 403 Forbidden with custom error codes `PENDING_APPROVAL` or `REGISTRATION_REJECTED`.

### BR-AUTH-03: Teacher Approval Path
- Teacher accounts must be manually approved by an `ADMIN` before activation.

### BR-AUTH-04: Student Approval Path
- Students must specify their target Class (`classId`) upon registration.
- Student accounts must be approved by the homeroom `TEACHER` of that class before activation.

### BR-AUTH-05: Token Configurations
- JWT Access Token lifespan: 2 hours.
- JWT Payload claims: `sub` (userId), `role`, `teacherProfileId` (if Teacher), `studentProfileId` (if Student), `classId` (if Student), `groupId` (if Student, if grouped).
- JWT Refresh Token lifespan: 7 days, stored in a secure, `HttpOnly` Cookie.

### BR-AUTH-06: Identity Linking
- If a user signs in via Google OAuth2, and their Google email matches a user account previously registered and verified via Phone Number, the system must link the Google identity to that account and log the user in.

---

## 2. Class Management (Class)

### BR-CLASS-01: Class Active Bounds
- At any point in time, a teacher is allowed a maximum of **one** class in the `ACTIVE` status.
- **DB Constraint**: `CREATE UNIQUE INDEX uq_class_active_per_teacher ON classes (teacher_id, status) WHERE status = 'ACTIVE'`

### BR-CLASS-02: Ended Class Immutability
- A teacher can transition an active class to `ENDED` (Stopping the class).
- Once a class is `ENDED`, all points, log lists, and weekly reports associated with that class are read-only. No insertions or edits are permitted.

---

## 3. Group Management (Groups)

### BR-GROUP-01: Group Membership Limit
- Each student profile can belong to at most one group (`groups`) at a time.
- **DB Constraint**: `student_profiles.group_id` foreign key references `groups(id)`.

### BR-GROUP-02: Group Leadership (Position)
- Each group has a maximum of **one** leader.
- The leader is assigned via `groups.leader_student_id`.
- The user's system role remains `STUDENT`. Leadership is a Position checked in the business Service layer.

---

## 4. Points & Grading (Points)

### BR-POINT-01: Score Calculation Invariant
- A student's current competition score is calculated dynamically:
  $$\text{Current Point} = \text{Base Point} + \sum (\text{point\_logs.point\_value})$$
  (For the student's current class).
- Scores should not be stored as a cached total column on the profile.

### BR-POINT-02: Immutable Log History
- The `point_logs` table is strictly immutable.
- No `UPDATE` or `DELETE` commands are permitted on `point_logs`.
- Corrections must be entered as a contra-balance log record explaining the adjustment.

### BR-POINT-03: Grading Authority Bounds
- **TEACHER**: Can log points for any student within their homeroom class.
- **GROUP_LEADER**: Can log points only for students belonging to their same group. Logging points for an out-of-group student must trigger a HTTP 403 `STUDENT_NOT_IN_GROUP` error.
- **STUDENT (Regular)**: Cannot log points.

### BR-POINT-04: Closed Week Restriction
- No point logs can be created for a week that is already locked (`weekly_reports.is_locked = true`).

---

## 5. Weekly Reports (Weekly Lock)

### BR-WEEK-01: Cron Scheduler Bounds
- The automatic chosing process runs at 23:59:59 PM every Sunday (`Asia/Ho_Chi_Minh` time zone).

### BR-WEEK-02: Snapshot Schema
- Weekly reports record: `snapshot_point` (final point total), `snapshot_base_point` (base point for the class), `total_bonus` (sum of additions), `total_penalty` (sum of subtractions), `rank_in_class`, and `rank_in_group`.

### BR-WEEK-03: Locked Week Isolation
- Once a weekly report is locked (`is_locked = true`), all points within that week's timeframe are permanently closed.

---

## 6. Dynamic Registration Sheets (Dynamic Forms)

### BR-FORM-01: Version Control Invariant
- Template updates increment the `version` counter (`version = version + 1`). Existing templates are deactivated (`is_active = false`) and a new record is saved (`is_active = true`).

### BR-FORM-02: Active Form Bounds
- Each class is permitted exactly one active template at a time.
- **DB Constraint**: `CREATE UNIQUE INDEX uq_form_active_per_class ON form_templates (class_id) WHERE is_active = TRUE`

### BR-FORM-03: Profile Integrity Validation
- Student submissions (`student_profiles.dynamic_profile`) are saved as JSONB. Schema properties must conform exactly to fields defined in the class's active `form_templates` version.

---

## 7. Security & Audit Trail (Security)

### BR-AUDIT-01: Admin Auditing
- Administrative adjustments and sensitive transactions must emit audit trail logs into the `audit_logs` table.

### BR-AUDIT-02: Tracked Actions List
The following actions must emit audit logs:
1. Approving/Rejecting student or teacher registrations.
2. Appointing or removing Group Leaders.
3. Transferring students between groups.
4. Activating new dynamic form templates.
5. Locking weekly reports.
6. Closing/Ending classes.

### BR-AUDIT-03: Audit Schema Invariant
- Audit records must record the actor (`actor_user_id`), action label (`action`), table target (`entity_name`, `entity_id`), and state difference (`old_value` and `new_value` in JSONB format).
