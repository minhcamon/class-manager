# Project Directory Structure

This document details the standard directory layout and file locations for both the backend (Spring Boot) and frontend (React) codebases of ClassManager.

---

## 1. Backend (Spring Boot 3.x)

```text
src/main/java/com/classmanager/
├── ClassManagerApplication.java
│
├── config/                            # Security, CORS, Database connection pools
│   ├── SecurityConfig.java
│   ├── JwtConfig.java
│   ├── CorsConfig.java
│   └── HikariConfig.java
│
├── controller/                        # Restful Controller endpoints
│   ├── AuthController.java
│   ├── UserController.java            # Account approvals and user operations
│   ├── SchoolYearController.java      # Academic years configuration
│   ├── StudentController.java         # Roster, personal & dynamic profiles
│   ├── GroupController.java           # Groups and leadership positions
│   ├── PointController.java           # Point logging and history queries
│   ├── WeeklyReportController.java    # Rankings, locks and scorecards
│   ├── DashboardController.java       # Aggregated statistics
│   ├── FormTemplateController.java    # Questionnaire structures
│   └── AuditLogController.java        # Auditing trails
│
├── service/                           # Core business logic and transaction bounds
│   ├── AuthService.java
│   ├── UserService.java
│   ├── SchoolYearService.java
│   ├── StudentService.java
│   ├── GroupService.java
│   ├── PointLogService.java           # Core validation checks for points
│   ├── WeeklyReportService.java       # Score computation and rankings
│   ├── FormTemplateService.java       # Form template versioning rules
│   └── AuditLogService.java           # Audit trail logging logic
│
├── repository/                        # JPA Database repositories
│   ├── UserRepository.java
│   ├── SchoolRepository.java
│   ├── SchoolYearRepository.java
│   ├── TeacherProfileRepository.java
│   ├── StudentProfileRepository.java
│   ├── GroupRepository.java
│   ├── PointLogRepository.java
│   ├── WeeklyReportRepository.java
│   ├── FormTemplateRepository.java
│   └── AuditLogRepository.java
│
├── entity/                            # Database mapping entity files
│   ├── User.java
│   ├── School.java
│   ├── SchoolYear.java
│   ├── TeacherProfile.java
│   ├── StudentProfile.java
│   ├── Group.java
│   ├── PointLog.java
│   ├── WeeklyReport.java
│   ├── FormTemplate.java
│   └── AuditLog.java
│
├── dto/                               # Request and response data transfer objects
│   ├── request/
│   │   ├── UserRegisterRequest.java
│   │   ├── PointLogRequest.java
│   │   ├── FormTemplateRequest.java
│   │   └── LeaderAssignRequest.java
│   └── response/
│       ├── AuthResponse.java
│       ├── StudentProfileResponse.java
│       └── PointLogResponse.java
│
├── exception/                         # Business validations exceptions and global handlers
│   ├── GlobalExceptionHandler.java
│   └── CustomExceptions.java          # Customized RuntimeExceptions
│
└── scheduler/                         # Automated tasks and cron scheduler
    └── WeeklyLockScheduler.java       # Sunday night lock scheduler
```

---

## 2. Frontend (React 19 + TypeScript)

```text
src/
├── main.tsx                           # Entry point bootstrap
├── App.tsx                            # Root router layouts
│
├── components/                        # UI Components
│   ├── common/
│   │   ├── ProtectedRoute.tsx         # Route protection guard
│   │   ├── Navbar.tsx                 # Header navigation
│   │   ├── Sidebar.tsx                # Contextual navigation sidebar
│   │   └── TableSkeleton.tsx          # TanStack Table loader skeleton
│   ├── dashboard/
│   │   ├── OverviewCards.tsx          # Stat cards panel
│   │   └── WeeklyChart.tsx            # Recharts points progression
│   └── points/
│       ├── PointLogTable.tsx          # Point log lists
│       └── AddPointForm.tsx           # Grader form modal
│
├── pages/                             # Dynamic page structures
│   ├── auth/
│   │   └── LoginPage.tsx              # Credentials and Google login page
│   ├── DashboardPage.tsx              # Analytics dashboard
│   ├── StudentListPage.tsx            # Roster and group splits
│   ├── WeeklyReportPage.tsx           # Scorecards and standings page
│   ├── FormBuilderPage.tsx            # Questionnaire creator (Teacher)
│   ├── ProfilePage.tsx                # Pupil detail answers page
│   ├── MyPointsPage.tsx               # Personal points breakdown
│   └── AuditLogPage.tsx               # Security audit trail views
│
├── types/                             # Centralized TS types/interfaces
│   ├── auth.ts
│   ├── student.ts
│   ├── point.ts
│   └── api.ts
│
├── services/                          # Axios API network communicators
│   ├── axiosInstance.ts               # Core Axios configurations
│   ├── authService.ts                 # Login / approvals calls
│   ├── studentService.ts              # Roster details calls
│   ├── pointService.ts                # Point logs calls
│   └── dashboardService.ts            # Analytics calculations calls
│
├── context/                           # Context global states
│   └── AuthContext.tsx                # Global session provider
│
└── utils/                             # Utilities functions
    ├── constants.ts
    └── dateUtils.ts
```
