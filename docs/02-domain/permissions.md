# Permission Matrix

This matrix summarizes the accessibility of various system actions across all system roles and organizational positions. This must be strictly enforced at the Web Security/Method security (e.g. `@PreAuthorize`) level on the backend and through route guards/conditional rendering on the frontend.

---

## 1. System Permission Matrix

| Functional Area / Action | ADMIN | TEACHER | STUDENT (Group Leader) | STUDENT (Regular) | Notes / Context |
|:---|:---:|:---:|:---:|:---:|:---|
| **Approve/Reject Teachers** | ✅ | ❌ | ❌ | ❌ | Transition user state from `PENDING` |
| **Approve/Reject Students** | ❌ | ✅ | ❌ | ❌ | Approve student access to designated class |
| **Import Student Roster** | ❌ | ✅ | ❌ | ❌ | Excel/CSV import for class profiles |
| **Assign/Revoke Group Leader** | ❌ | ✅ | ❌ | ❌ | Update `groups.leader_student_id` |
| **Create Form Templates** | ❌ | ✅ | ❌ | ❌ | Design new versioned profiles |
| **Transfer Student Groups** | ❌ | ✅ | ❌ | ❌ | Move students between different `groups` |
| **Log Competition Points** | ❌ | ✅ | ✅ | ❌ | Teacher: class-wide. Leader: group-only. |
| **Manual Week Lock** | ❌ | ✅ | ❌ | ❌ | Lock snapshot of current week points |
| **End/Stop Class** | ❌ | ✅ | ❌ | ❌ | Shift class status to `ENDED` (read-only) |
| **View Audit Logs** | ✅ | ✅ | ❌ | ❌ | Admin: system-wide. Teacher: class-wide. |
| **View Competition Points** | ❌ | ✅ | ✅ | ✅ | Teacher: class. Leader: group. Student: self. |
| **Update Personal Profile** | ❌ | ❌ | ✅ | ✅ | Fill dynamic profile registration sheet |

---

## 2. Fine-Grained Authorization Scopes

### 2.1 Teacher-Class Isolation
No teacher is authorized to view or edit records belonging to a different class they do not own (classes where `teacher_id` matches the teacher's profile ID). Database queries and API requests must always partition results by the authenticated user's class ownership.

### 2.2 Peer-Grading Constraints (Group Leaders)
When a Group Leader submits a point log via `/api/v1/points`, the backend must perform a runtime membership check:
- The target student's `group_id` must match the Group Leader's `group_id`.
- If they do not match, the request must fail with an HTTP 403 Forbidden status containing the error code `STUDENT_NOT_IN_GROUP`.
