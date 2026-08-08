# Security & Authentication Rules

## 1. Authentication & Session Validation
- **Session Checks**: Protect all dashboard routes (`/dashboard/*`) and API endpoints with NextAuth session verification via `getServerSession(authOptions)` (`src/lib/auth.ts`).
- **Active Context & Membership Checks**: Always verify active project membership and permissions before processing project/task resources using `getActiveProjectContext` (`src/lib/active-project.ts`) and `getProjectMember` (`src/lib/project.ts`).
- **Password Security**: Use `bcryptjs` for secure password hashing (`src/services/auth/auth.service.ts`).
- **Password Reset Hashing**: Store password reset tokens securely as SHA-256 hashes (`tokenHash`) in `PasswordResetToken` table (`src/lib/password-reset.ts`).
- **API Token Management**: Manage hashed API tokens securely via `src/services/user/api-token.service.ts`.

---

## 2. OTP Security & Rate Limiting Rules (`src/services/otp/otp.service.ts`)
- **Attempts Limit**: Maximum 5 failed OTP attempts allowed per verification code (`otpAttemptCount`).
- **Soft Block**: Exceeding 5 failed attempts places the account in a 3-hour Soft Block (`otpSoftBlockUntil`).
- **Permanent Block**: Accumulating 3 Soft Blocks permanently locks the user status to `BLOCKED`.
- **Admin Unblock**: Only System Administrators can unblock a `BLOCKED` user via User Management (`/dashboard/user-management`).

---

## 3. Safe Logging & Data Privacy
- **NEVER** log passwords, raw OTP codes, API tokens, JWT secrets, or sensitive user credentials in console logs, server output, or activity descriptions.
- Debug logs for notifications and workflows MUST only output safe metadata (e.g. Task ID, Project Name, Project Owner ID, Recipient Email).
