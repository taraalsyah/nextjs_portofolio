# Permission & Approval Workflow Rules

## 1. Dual-Layer Authorization System

### System-Wide RBAC
- **Models**: `User` -> `Role` -> `Permission` -> `RolePermission`.
- **Scope**: System Administration, Global User Management (`/dashboard/user-management`), and Role Management (`/dashboard/role-management`).
- **Endpoints**: `/api/users`, `/api/roles`, `/api/roles/[id]/permissions`.

### Project-Level Permissions
- **Models**: `ProjectMember`, `ProjectRolePermission`, `ProjectWorkflowPermission`.
- **Project Roles**: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`.
- **Core Permission Helpers** (`src/lib/project.ts` & `src/lib/active-project.ts`):
  - `getActiveProjectContext(userId, userName, req)`: Resolves active project context, active membership, and user permissions.
  - `getProjectMember(projectId, userId)`: Fetches project membership and role.
  - `getProjectPermissions(role, projectId)`: Fetches reconfigurable permission matrix for the role.
  - `checkProjectPermission(projectId, userId, permissionKey)`: Verifies granular project action permission.
  - `checkProjectWorkflowPermission(projectId, userId, fromStatus, toStatus)`: Verifies status transition permission.

---

## 2. Request to Done & Request to Close Workflows

### Request to Done Workflow
- **Assignee Action**: Member/Assignee submits request via `/api/tasks/[id]/request-done`. Sets `doneRequestStatus = 'PENDING'`. Task status remains unchanged.
- **Reviewer Authorization**: `OWNER` or `ADMIN` reviews via `/api/tasks/[id]/approve-done` or `/api/tasks/[id]/reject-done`.
- **Outcome**: Approving sets `status = 'DONE'`, `doneRequestStatus = 'APPROVED'`. Rejecting sets `doneRequestStatus = 'REJECTED'`, status remains `IN_PROGRESS`.

### Request to Close Workflow
- **Assignee Action**: Member/Assignee submits request via `/api/tasks/[id]/request-close`. Sets `closeRequestStatus = 'PENDING'`. Task status remains unchanged.
- **Strict Email Recipient Resolution**:
  - Email notification MUST be sent EXCLUSIVELY to `[project.owner.email]` via `sendTaskCloseNotification` (`src/lib/notification.ts`).
  - Recipient MUST be resolved strictly via relation: `Task` -> `Project` -> `Project Owner` -> `owner.email`.
  - DO NOT send Request to Close emails to other project members, assignees, creators, admins, or viewers.
  - If project owner or owner email is missing, log an error and skip sending. NEVER use fallback recipients.
- **Reviewer Authorization**: `OWNER` or `ADMIN` reviews via `/api/tasks/[id]/approve-close` or `/api/tasks/[id]/reject-close`.
- **Outcome**: Approving sets `status = 'CLOSED'`, `closeRequestStatus = 'APPROVED'`. Rejecting sets `closeRequestStatus = 'REJECTED'`, status reverts to previous state.
