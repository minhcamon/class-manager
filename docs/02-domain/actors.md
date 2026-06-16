# Actors & Roles

ClassManager defines clear distinctions between **System Roles** (managed via Role-Based Access Control at the application/JWT level) and **Organizational Positions** (managed via business logic constraints at the Service level).

---

## 1. System Roles (RBAC)

These roles determine global endpoint filtering and JWT-level permissions.

### 1.1 ADMIN (System Administrator)
- **Description**: The top-level administrator of the entire platform.
- **Scope**: Platform-wide.
- **Core Responsibilities**:
  - Managing the list of schools (`schools`).
  - Approving or rejecting Teacher registration profiles (`teacher_profiles`).
  - Accessing platform-wide system audit logs (`audit_logs`).

### 1.2 TEACHER (Homeroom Teacher)
- **Description**: An educator responsible for a specific class within a school.
- **Scope**: School-level (for school years) and Class-level (for classroom management).
- **Core Responsibilities**:
  - Initializing and ending school years (`school_years`).
  - Reviewing and approving/rejecting Student registration profiles (`student_profiles`) for their class.
  - Importing student rosters.
  - Creating and restructuring Groups (`groups`) and assigning Group Leaders.
  - Formulating and activating dynamic registration sheet structures (`form_templates`).
  - Grading any student in the homeroom class.
  - Manually locking weekly points calculations (`weekly_reports`).
  - Consulting class-level audit logs.

### 1.3 STUDENT (Student)
- **Description**: A registered pupil in a particular class.
- **Scope**: Personal/Group-level.
- **Core Responsibilities**:
  - Viewing their own competition standing and personal point logs.
  - Completing and updating dynamic registration sheets.

---

## 2. Organizational Positions (Service-Level)

Positions do not map to separate system roles in the JWT credentials. Instead, they are defined by properties on relations and evaluated programmatically in the backend Service layer.

### 2.1 GROUP_LEADER (Tổ trưởng)
- **System Role**: `STUDENT`.
- **Database Mapping**: Represented by `groups.leader_student_id` matching the student's profile ID.
- **Definition**: A student assigned by the teacher to lead a specific Group (`groups`).
- **Core Responsibilities**:
  - Grading (positive or negative point logs) members of their own group (including themselves).
  - Viewing point logs and competition standings of all members in their group.
- **Limitations**: Prohibited from grading students in other groups or accessing class-wide administrative controls.
