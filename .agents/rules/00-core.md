# Core Principles & Standards

## 1. Stack & Technologies
- **Framework**: Next.js 14+ (App Router, TypeScript).
- **Database & ORM**: MySQL with Prisma ORM (`prisma/schema.prisma`).
- **Auth**: NextAuth.js (Credentials Provider with JWT sessions), Passwords via `bcryptjs`, OTP Email Verification (`src/services/otp/otp.service.ts`).
- **Styling**: Vanilla CSS Modules with Glassmorphism Design Tokens (`var(--glass-border)`, `var(--primary-glow)`).
- **Email**: Nodemailer Singleton (`src/lib/mail.ts`) & Email Service (`src/services/email/email.service.ts`) with Zoho SMTP.
- **Mobile Integration**: Capacitor Native Platform Support (`src/components/capacitor/`, `src/hooks/useCapacitorPlatform.ts`).

## 2. General Engineering Rules
- **No Superficial Patches**: Never mask errors, swallow exceptions without logging, or return dummy fallbacks.
- **Preserve Documentation**: Maintain existing comments and docstrings when modifying code.
- **Obey Explicit Directives**: Adhere strictly to project requirements, layout boundaries, and business logic without arbitrary changes.
- **Empirical Log Verification**: Always check logs and stack trace before diagnosing runtime or build errors.
- **Mandatory Verification**: Never claim a task is completed without running typecheck/build verification (`./node_modules/.bin/tsc --noEmit` or `npm run build`).

## 3. Communication & File Links
- Format responses in GitHub-style markdown.
- Link to specific files using standard Markdown syntax with absolute file URIs: `[filename](file:///Users/mac/Documents/NextJs/portofolio/path/to/file)`.

---

## 4. Self-Maintaining Living Documentation

All `.agents/rules/*.md` files are **living project documentation** that must accurately reflect the codebase state.

### Technical / Documentation Discrepancies
AI **CAN and MUST automatically update `.md` files** when discrepancies are technical or documentation-related:
- File path or directory structure changes.
- Function, variable, component, or service renames.
- API route endpoint changes.
- Prisma schema field or model updates.
- TypeScript type or interface adjustments.
- Technical helper/service implementation updates.

### Business Logic Discrepancies
AI **MUST NOT guess or alter business logic** (statuses, approval workflows, permissions, security policies, roles, notification recipients, billing, data ownership).
If a discrepancy between rules and actual codebase business logic is found:
1. Identify the discrepancy clearly.
2. Explain actual codebase behavior vs written rule.
3. Do not modify business logic or rules unilaterally to cover up bugs or inconsistencies.
4. If intended business behavior is ambiguous, request explicit user confirmation.

### Source of Truth Hierarchy
```text
Explicit User Requirement
        ↓
Confirmed Business Requirement
        ↓
Actual Codebase
        ↓
Technical Documentation / Rules
```

### Minimal Change Principle
When updating `.md` files, update only the outdated sections while preserving all valid rules.
