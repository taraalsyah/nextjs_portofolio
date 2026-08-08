# Database & Prisma Rules

## 1. Schema Conventions & Model Inventory
- **Table Naming**: Table names map to pluralized snake_case (`@@map("users")`, `@@map("projects")`, `@@map("tasks")`, `@@map("activity_logs")`).
- **Column Naming**: Field names map to snake_case (`@map("created_at")`, `@map("owner_user_id")`, `@map("is_locked")`).
- **Primary Models**:
  - **Auth & Users**: `User`, `EmailVerification`, `PasswordResetToken`, `Role`, `Permission`, `RolePermission`.
  - **Projects & Permissions**: `Project`, `ProjectMember`, `ProjectRolePermission`, `ProjectWorkflowPermission`.
  - **Tasks & Collaboration**: `Task`, `TaskCategory`, `TaskChecklist`, `TaskComment`, `TaskAttachment`, `TaskHistory`.
  - **Audit Trail**: `ActivityLog`.
- **Soft Delete Pattern**: Use `deletedAt DateTime?` (`@map("deleted_at")`) for soft deleting tasks and critical records.

---

## 2. High-Performance Indexing Strategy
- Single-column indexes on primary foreign keys and query filters (`@@index([projectId])`, `@@index([status])`, `@@index([assigneeId])`, `@@index([deletedAt])`).
- Composite indexes for high-frequency production queries (100k+ tasks):
  - `@@index([projectId, status])`
  - `@@index([projectId, assigneeId])`
  - `@@index([status, priority])`
  - `@@index([assigneeId, status])`
  - `@@index([deletedAt, assigneeId, status])`

---

## 3. Interactive Transaction Safety
- **Explicit Timeouts**: Always include explicit transaction options `{ maxWait: 5000, timeout: 15000 }` on interactive `prisma.$transaction(async (tx) => { ... })` calls to prevent premature transaction timeouts under high load.
- **Keep Non-DB Async Operations Outside Transactions**: Email dispatches (`sendEmail`), password hashing (`bcrypt.hash`), and external HTTP requests MUST be executed BEFORE or AFTER the `$transaction` block, never inside it.

---

## 4. Singleton Instance & Usage
- Always import `prisma` from `@/lib/prisma`. Do not instantiate `new PrismaClient()` directly in API routes or service files.
