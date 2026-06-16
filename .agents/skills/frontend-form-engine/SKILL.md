---

name: frontend-form-engine
description: Standardized form architecture and validation patterns for ClassManager. Governs React Hook Form, Zod, Dynamic Form rendering, OTP flows, approval workflows, submission states, and error handling. Prevents form logic duplication and inconsistent UX.
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Frontend Form Engine

Before implementing any form, run through this file top to bottom.

Do not create a form component until Phase 3 clears.

---

## Phase 1 — Form Classification

Classify the form into exactly one category.

| Type            | Description                                   | Examples                      |
| --------------- | --------------------------------------------- | ----------------------------- |
| SIMPLE_FORM     | Static fields with straightforward validation | Login, Profile Update         |
| DYNAMIC_FORM    | Fields generated from backend schema          | Student Dynamic Profile       |
| OTP_FORM        | Verification code flow                        | Phone Verification            |
| APPROVAL_FORM   | Approve/Reject workflows                      | Teacher Approval              |
| FILTER_FORM     | Search and filtering UI                       | Student Table Filters         |
| MULTI_STEP_FORM | Sequential user flow                          | Register → Pending → Approved |

If multiple categories apply:

Priority:

```text
MULTI_STEP_FORM
→ DYNAMIC_FORM
→ APPROVAL_FORM
→ OTP_FORM
→ SIMPLE_FORM
→ FILTER_FORM
```

---

## Phase 2 — Mandatory Stack

All forms must use:

```text
React Hook Form
Zod
TypeScript
```

Never use:

```text
useState per field
custom validation in JSX
manual error tracking
```

Forbidden:

```tsx
const [email, setEmail] = useState("")
const [error, setError] = useState("")
```

---

## Phase 3 — Schema Design

Validation must be defined before UI.

Required order:

```text
Zod Schema
→ Form Type
→ Form Component
→ API Integration
```

Example:

```ts
const schema = z.object({
  phoneNumber: z.string().min(10),
  otp: z.string().length(6)
})

type FormValues = z.infer<typeof schema>
```

Never duplicate validation logic.

Bad:

```tsx
if(password.length < 8)
```

inside components.

---

## Phase 4 — Dynamic Form Rules

Backend is source of truth.

Example:

```json
[
  {
    "type": "TEXT",
    "key": "fullName"
  },
  {
    "type": "SELECT",
    "key": "shirtSize"
  }
]
```

Frontend renders dynamically.

Never hardcode backend-configurable fields.

---

### Field Registry Pattern

Required:

```ts
const fieldRegistry = {
  TEXT: TextField,
  SELECT: SelectField,
  DATE: DateField,
  PHONE: PhoneField
}
```

Use:

```tsx
const Component = fieldRegistry[field.type]
return <Component />
```

Never:

```tsx
if(type==="TEXT")
if(type==="SELECT")
if(type==="DATE")
```

throughout the application.

---

## Phase 5 — OTP Rules

OTP UI must support:

```text
6 inputs
auto focus next
backspace previous
paste support
countdown timer
resend action
cooldown protection
```

**Mock OTP UI Display Rule (MVP/Dev)**:
- Nếu API response gửi OTP trả về trường `otp` dạng plain text (khi `SMS_API_KEY` trống), Frontend bắt buộc phải hiển thị mã này lên màn hình thông qua Inline Alert hoặc Toast (ví dụ: *"Mã OTP thử nghiệm của bạn là: XXXXXX"*) để người dùng có thể nhập trực tiếp. Không để ẩn mã khiến người dùng không thể đăng nhập.


Required states:

```text
IDLE
VERIFYING
SUCCESS
FAILED
EXPIRED
```

Never use booleans:

```text
isSuccess
isFailed
isExpired
```

simultaneously.

---

## Phase 6 — Approval Form Rules

Used for:

```text
Approve Student
Reject Student
Assign Leader
Lock Week
End School Year
```

Requirements:

```text
Confirmation Dialog
Optional Comment
Reason Field (for reject)
Loading State
Success Feedback
```

Reject actions require reason.

Never allow silent rejection.

---

## Phase 7 — Submission State Machine

Every form must implement:

```text
IDLE
SUBMITTING
SUCCESS
ERROR
```

Rules:

```text
Disable submit while pending
Prevent double submit
Preserve user input on failure
```

Never:

```tsx
button remains clickable during request
```

---

## Phase 8 — Error Handling

Display separately:

```text
Field Errors
Form Errors
API Errors
```

Example:

```text
Email is required
```

≠

```text
Failed to connect to server
```

Never expose backend stack traces.

---

## Phase 9 — Accessibility Rules

Every form must:

```text
associate label and input
support keyboard navigation
focus first invalid field
announce validation messages
```

Required:

```tsx
<label htmlFor="phone">
```

Never rely only on placeholder text.

---

## Phase 10 — Output Checklist

Before returning any form implementation:

```text
□ React Hook Form used
□ Zod schema exists
□ Form values inferred from schema
□ No field-level useState
□ Submit disabled during request
□ Validation centralized
□ Error messages displayed
□ API integration separated from UI
□ Dynamic fields use registry
□ No duplicated validation logic
□ Keyboard accessible
□ Typescript strict-safe
```

---

## Anti Patterns

Never:

```text
Validation inside JSX

useState for every field

alert() for errors

Hardcoded dynamic fields

Multiple sources of truth

Business rules inside UI

Duplicated schemas

Direct axios calls in components
```

---

## Success Criteria

A completed form implementation:

```text
Uses React Hook Form + Zod

Supports loading and error states

Works with backend contracts

Handles validation consistently

Can scale without modifying component logic

Maintains accessibility standards
```
