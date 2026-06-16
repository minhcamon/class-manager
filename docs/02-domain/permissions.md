# Permission Matrix

This matrix summarizes the accessibility of various system actions across all system roles and organizational positions. This must be strictly enforced at the Web Security/Method security (e.g. `@PreAuthorize`) level on the backend and through route guards/conditional rendering on the frontend.

---

## 1. System Permission Matrix

| Functional Area / Action | ADMIN | TEACHER | STUDENT (Group Leader) | STUDENT (Regular) | Notes / Context |
|:---|:---:|:---:|:---:|:---:|:---|
| **Manage Schools (`schools`)** | ✅ | ❌ | ❌ | ❌ | Create, Read, Update, Delete schools |
| **Approve/Reject Teachers** | ✅ | ❌ | ❌ | ❌ | Transition user state from `PENDING` |
| **Initialize School Year** | ❌ | ✅ | ❌ | ❌ | Set new year to `ACTIVE` |
| **Approve/Reject Students** | ❌ | ✅ | ❌ | ❌ | Approve student access to designated class |
| **Import Student Roster** | ❌ | ✅ | ❌ | ❌ | Excel/CSV import for class profiles |
| **Assign/Revoke Group Leader** | ❌ | ✅ | ❌ | ❌ | Update `groups.leader_student_id` |
| **Create Form Templates** | ❌ | ✅ | ❌ | ❌ | Design new versioned profiles |
| **Transfer Student Groups** | ❌ | ✅ | ❌ | ❌ | Move students between different `groups` |
| **Log Competition Points** | ❌ | ✅ | ✅ | ❌ | Teacher: class-wide. Leader: group-only. |
| **Manual Week Lock** | ❌ | ✅ | ❌ | ❌ | Lock snapshot of current week points |
| **End School Year** | ❌ | ✅ | ❌ | ❌ | Shift year status to `ENDED` (read-only) |
| **View Audit Logs** | ✅ | ✅ | ❌ | ❌ | Admin: system-wide. Teacher: class-wide. |
| **View Competition Points** | ❌ | ✅ | ✅ | ✅ | Teacher: class. Leader: group. Student: self. |
| **Update Personal Profile** | ❌ | ❌ | ✅ | ✅ | Fill dynamic profile registration sheet |

---

## 2. Fine-Grained Authorization Scopes

### 2.1 Cross-School Isolation (Multi-Tenancy)
No role (including `TEACHER` and `STUDENT`) is authorized to view, create, or update records belonging to a different school (`school_id`). Database queries and API requests must always partition results by the authenticated user's `school_id` (retrieved from the JWT claims).

### 2.2 Peer-Grading Constraints (Group Leaders)
When a Group Leader submits a point log via `/api/v1/points`, the backend must perform a runtime membership check:
- The target student's `group_id` must match the Group Leader's `group_id`.
- If they do not match, the request must fail with an HTTP 403 Forbidden status containing the error code `STUDENT_NOT_IN_GROUP`.
