# Coding Conventions

This document outlines the coding standards, error schemas, timezone rules, environment variable management, and quality guidelines for ClassManager developers and coding agents.

---

## 1. Quality & Completeness Rules

- **Zero Placeholders**: Placeholders such as `// ...`, `// TODO`, `/* implement here */`, or structural shortcuts (e.g., leaving a method body empty or describing code in comments rather than writing it) are strictly banned. All generated files and code changes must be fully complete and deployable.
- **Strict Typing**: TypeScript code must compile without `any`. Use custom types or interfaces for all API payloads and entities.

---

## 2. Validation Standards

### 2.1 Backend Bean Validation (Spring Boot)
- All request DTO parameters must be validated at the controller level using Java Bean Validation annotations:
  - Use `@NotNull` and `@NotBlank` for required properties.
  - Use `@Size(min = X, max = Y)` to limit text inputs.
  - Use `@Pattern` for strict formats (e.g. phone number regex).
  - Use `@Min` and `@Max` to restrict numerical fields (e.g., `pointValue` between `[-100, 100]`).
- Controllers must use `@Valid` or `@Validated` on request bodies.

### 2.2 Frontend Validation (React)
- Implement frontend validations using **React Hook Form** + **Zod**.
- Match Zod constraints with backend validations to guarantee consistent errors.

---

## 3. Standardized Error Response Formats

The backend must consistently return a uniform JSON format for all errors. The global exception handler must catch all checked and unchecked business exceptions and map them to the following payload:

```json
{
  "timestamp": "2026-09-01T10:00:00+07:00",
  "status": 403,
  "error": "FORBIDDEN",
  "message": "Không có quyền thực hiện hành động này",
  "details": [],
  "path": "/api/v1/points"
}
```

### Specific Error Code List
- `VALIDATION_ERROR` (400): Request properties invalid (details should hold field-level error messages).
- `UNAUTHORIZED` (401): Missing or invalid authentication token.
- `PENDING_APPROVAL` (403): User status is `PENDING`.
- `REGISTRATION_REJECTED` (403): User status is `REJECTED`.
- `STUDENT_NOT_IN_GROUP` (403): Group Leader graded a student outside their group.
- `WEEK_ALREADY_LOCKED` (409): Target week locked.
- `SCHOOL_YEAR_ENDED` (409): Year ended.
- `ACTIVE_SCHOOL_YEAR_EXISTS` (409): Duplicate active year.
- `NOT_FOUND` (404): Resource not found.

---

## 4. Timezone & Locale Invariants

- **Standard Timezone**: `Asia/Ho_Chi_Minh` (UTC+7).
- The application clock must be explicitly forced to UTC+7. Configure timezone configuration on both:
  - Spring Boot app startup (`TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"))`).
  - Database connection string parameter (`&serverTimezone=Asia/Ho_Chi_Minh`).
  - Schedulers timezone setting (`@Scheduled(cron = "...", zone = "Asia/Ho_Chi_Minh")`).

---

## 5. Environment Variable (ENV) Configurations

- **No Hardcoding**: Credentials, database URLs, JWT secret keys, CORS origins, and API keys must never be committed to source control or hardcoded in the codebase.
- **Backend Configuration**: Read variables in `application.yml` from environment properties (e.g., `url: ${DB_URL}`). Maintain `.env.example` in root directories; never commit `.env`.
- **Frontend Configuration**: Access variables using the `VITE_` prefix (e.g. `import.meta.env.VITE_API_BASE_URL`).
