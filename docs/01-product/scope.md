# Product Scope: ClassManager

This document delineates the functional boundaries of ClassManager. It specifies what features are included in the production-ready MVP and what features are explicitly deferred to future releases.

---

## 1. Functional Scope (In-Scope MVP)

### 1.1 Multi-Tenant Organization Structure
- **Schools**: Creation and management of schools by system administrators.
- **School Years**: Maintenance of independent school years per school. System supports one `ACTIVE` school year per school at a time.
- **Classes**: Mapping of homeroom classes (e.g., "10A1") to grades 10–12, assigned to exactly one Teacher.
- **Groups**: Class segmentation into groups (Tổ) for peer-grading structures.

### 1.2 User-Centric Authentication & Profiles
- **Unified Identity**: Integrated account registry supporting Google OAuth2 (`google_email`) and verified Phone Numbers (`phone_number` + OTP logic).
- **Profile Segregation**: Separation of system access credentials (`users`) from domain roles (`teacher_profiles` or `student_profiles`).
- **Approval Lifecycle**: Accounts begin in `PENDING` state and require manual activation (Teachers approved by ADMIN; Students approved by their Class TEACHER).

### 1.3 Immutable Point Logging
- **Point System**: Accumulation of performance points starting from a school year's base point.
- **Immutability**: Absolute block on `UPDATE` and `DELETE` queries on point histories. Corrections are done exclusively via counter-balancing point logs.
- **Grading Delegation**: Teachers can grade anyone in their class; Group Leaders are restricted to grading members of their assigned group.

### 1.4 Weekly Point Locking
- **Automated Scheduler**: A weekly cron job running at 23:59 on Sunday (`Asia/Ho_Chi_Minh`) to compute and lock weekly snapshot records (`weekly_reports`).
- **Manual Lock**: Option for teachers to trigger a manual week lock prior to the automated cron run.
- **Week Lock Constraint**: Once a week is locked, no points can be modified or logged for that week.

### 1.5 Versioned Dynamic Profiles
- **Versioning Templates**: Schema creation for student profiles with automatic version increments. Only one template is `ACTIVE` per class.
- **JSONB Answer Storage**: Dynamic student profile responses stored as structured JSONB documents matching the schema of the active template.

### 1.6 Auditing
- **System Audit Trails**: Automated interception of sensitive administrator actions, tracking old and new values in JSON format.

---

## 2. Out-of-Scope (Deferred to Phase 2)

The following capabilities are excluded from the current implementation and must not be coded or architected as part of the initial release:

- **AI/RAG Chatbot**: Chat interfaces, conversational assistants, and retrieval-augmented generation modules.
- **Automated Zalo/SMS notifications**: Event-triggered messaging (e.g., points alert, weekly reports notifications) to parent/student phones, except for verification OTP delivery during auth.
- **Native Mobile Applications**: Android or iOS applications. The UI is exclusively web-based.
- **School-wide competition rules**: Cross-class grading or global school rankings (the system isolates competition at the Class level).
