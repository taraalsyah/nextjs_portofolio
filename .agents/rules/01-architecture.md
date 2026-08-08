# Architecture & Module Boundaries

## 1. Directory Organization & Layering
- **App Router (`src/app/`)**: Thin controllers only. Pages handle routing and top-level layout; API routes handle HTTP request/response validation and session checks.
- **API Routes (`src/app/api/`)**: Endpoints grouped by domain (`auth/`, `profile/`, `projects/`, `tasks/`, `task-categories/`, `users/`, `roles/`, `email/`).
- **Domain Services (`src/services/`)**: Business logic & service handlers grouped by feature (`auth/`, `user/`, `otp/`, `email/`).
- **Shared Helpers & Business Logic (`src/lib/`)**: Core database access, helpers, and utilities (`prisma.ts`, `auth.ts`, `project.ts`, `task.ts`, `active-project.ts`, `activity.ts`, `notification.ts`, `mail.ts`, `session.ts`, `password-reset.ts`, `token.ts`, `date.ts`, `apiHelper.ts`).
- **Components (`src/components/`)**: UI components divided by domain (`task-management/`, `project/`, `profile/`, `layout/`, `ui/`, `capacitor/`).
- **Context & Hooks (`src/context/`, `src/hooks/`)**: State providers (`ProjectContext.tsx`) and reusable hooks (`useProjectMembers.ts`, `useCapacitorPlatform.ts`).
- **Validation Schemas (`src/validators/`)**: Input validation schemas (`auth.ts`, `user.ts`).

## 2. Server vs Client Component Boundaries
- Top-level page files use `'use client'` only when state hooks (`useState`, `useEffect`) or interactive browser APIs are required.
- Keep Client Components lean by extracting domain logic to server-side helpers or API routes.

## 3. Shell Execution Guidelines
- NEVER execute `cd` commands. Always specify `Cwd` explicitly in tool calls.
