# Product Vision: ClassManager

## 1. Executive Summary
ClassManager is designed as a production-grade, multi-school online homeroom class management platform. It addresses the overhead, errors, and lack of transparency associated with traditional homeroom tracking (diểm thi đua, student registration, dynamic profiles, and weekly summaries). 

By automating point calculations, grading logic, and report locks, ClassManager provides homeroom teachers, school administrators, and students with a unified, transparent, and multi-tenant environment to track performance and manage classrooms.

---

## 2. Core Value Proposition
- **Transparency & Trust**: Implements immutable auditing for all competitive point changes (`point_logs`) and system logs (`audit_logs`).
- **Administrative Automation**: Replaces manual spreadsheets with scheduled cron-jobs for weekly point chosing (`weekly_reports`), automatic student grade advancement, and dynamic data collection.
- **Role-Free Architecture**: Decouples API endpoints from system security roles, executing fine-grained permission validations on the service layer based on organizational positions (e.g., Group Leaders).
- **Scalability**: A multi-tenant database design ensuring multi-school, multi-school-year, and class-level separation.

---

## 3. Organizational Structure Hierarchy
The system enforces a strict multi-level containment hierarchy:

```text
[System]
   └── [School] (Multi-school isolation)
          └── [School Year] (Independent school years; max 1 ACTIVE at a time)
                 └── [Class] (Managed by a Teacher Profile)
                        └── [Group] (Student groups; max 1 Group Leader position)
                               └── [Student Profile] (Belongs to max 1 Group)
```

---

## 4. Target Audiences & Success Indicators

### School Administrators (ADMIN)
- **Need**: Managing school registries, approving teacher profiles, ensuring global compliance.
- **Success Indicator**: Zero unauthorized teachers, simple multi-school bootstrap, full system audibility.

### Homeroom Teachers (TEACHER)
- **Need**: Standardizing classroom competition rules, collecting pupil background data, automating grading and ranking, structuring pupil organizations.
- **Success Indicator**: Auto-generated weekly rankings, easy customization of profile collection sheets, zero manual point consolidation errors.

### Student Organization Leaders (GROUP_LEADER / Tổ trưởng)
- **Need**: Offloading grading workloads from teachers, tracking points for organization members, maintaining discipline transparently.
- **Success Indicator**: Direct input of points/penalties restricted to organization members, no cross-organization interference.

### Students (STUDENT / Thường)
- **Need**: Real-time visibility into competition standing, filling out school registration forms securely.
- **Success Indicator**: Instant profile updates, transparent visibility of personal point logs.
