---
trigger: always_on
---

# Core Engineering Principles & Standards

## 1. Core Engineering Principles

### Follow Existing Codebase Patterns

Always inspect the existing implementation before introducing new patterns.

Check relevant:

```text
src/lib/
src/services/
src/components/
src/hooks/
src/context/
src/app/
```

Before creating a new:

* helper
* service
* component
* hook
* utility
* API pattern
* database access pattern

search the codebase first.

Prefer reusing or extending an existing implementation over creating a duplicate abstraction.

---

### Inspect Before Modify

For every coding task, follow this general workflow:

```text
Understand Requirement
        ↓
Inspect Relevant Code
        ↓
Search Existing Implementation
        ↓
Identify Dependencies
        ↓
Modify
        ↓
Verify
```

Do not modify code based only on the filename, error message, or assumption about how the application works.

---

### No Premature Refactoring

Do not:

* reorganize folders
* rename files
* rewrite working modules
* introduce new architecture patterns
* replace existing libraries
* perform broad refactoring

unless:

1. explicitly requested,
2. required to complete the task, or
3. necessary to fix a verified technical problem.

Prefer the smallest safe change that solves the actual requirement.

---

### No Error Suppression or Superficial Patches

Never use the following merely to hide or bypass errors:

```text
@ts-ignore
@ts-nocheck
empty catch blocks
dummy data
fake success responses
commenting out broken code
unnecessary type assertions
disabling validation
```

Do not suppress an error without understanding its cause.

If a fallback is part of legitimate business behavior, implement it explicitly rather than using it as an error-masking mechanism.

---

### Evidence-Based Debugging

Diagnose problems using available evidence.

Preferred sources:

```text
TypeScript errors
Build logs
Runtime stack traces
Browser console
Server logs
Database errors
Actual source code
Existing tests
```

For TypeScript issues, use the project's installed TypeScript/compiler configuration.

Example:

```bash
./node_modules/.bin/tsc --noEmit
```

Do not invent a cause when the available evidence is insufficient.

---

### Preserve Existing Documentation

Preserve useful existing:

* comments
* docstrings
* inline explanations
* architectural notes

unless they are:

* outdated
* incorrect
* contradictory to the implementation
* directly related to the code being changed

Do not preserve incorrect documentation merely because it already exists.

Do not change public interfaces or type signatures unnecessarily.

If a type signature is demonstrably incorrect and must be fixed, fix it rather than preserving an incorrect definition.

---

### Mandatory Verification

After code changes, run the most relevant verification available for the change.

For application code, this may include:

```bash
./node_modules/.bin/tsc --noEmit
```

or:

```bash
npm run build
```

Also run relevant:

* tests
* lint
* Prisma validation
* API verification
* UI verification

when applicable.

Documentation-only changes do not require a full application build unless there is a specific reason.

Never claim a coding task is verified if the relevant verification has not been performed.

---

## 2. Technical Stack & Project Reference

The current project technology should be verified from the actual codebase and configuration.

### Framework

```text
Next.js
App Router
TypeScript
```

Verify the actual version from:

```text
package.json
package-lock.json
```

Do not hard-code a framework version in rules unless that version is intentionally part of the project requirement.

---

### Database & ORM

```text
MySQL
Prisma ORM
prisma/schema.prisma
```

Prisma models, relations, fields, and enums must be verified against the current schema.

---

### Authentication

Current authentication implementation uses:

```text
NextAuth.js
Credentials authentication
JWT sessions
bcryptjs password hashing
Email OTP verification
```

Relevant implementation should be verified from the current codebase, including locations such as:

```text
src/lib/auth.ts
src/app/api/auth/[...nextauth]/route.ts
src/services/otp/
```

Do not assume these paths remain unchanged. If implementation paths change, update technical documentation accordingly.

---

### Styling

The project uses:

```text
CSS Modules
Existing design tokens
```

Existing CSS variables/tokens should be reused.

Examples:

```text
var(--glass-border)
var(--primary-glow)
```

Do not introduce a new styling architecture for a single feature.

---

### Email

Use the existing email abstraction.

Current implementation includes:

```text
src/lib/mail.ts
src/services/email/email.service.ts
```

The application currently uses Nodemailer.

Do not create a second email/SMTP implementation when the existing service can be reused.

The actual SMTP provider must be determined from the current implementation/configuration and should not be treated as a permanent architectural requirement.

---

### Mobile Support

The project includes Capacitor integration.

Relevant implementation includes:

```text
src/components/capacitor/
src/hooks/useCapacitorPlatform.ts
```

Do not assume every web feature automatically requires native Capacitor changes.

Only modify native/mobile integration when the requirement affects it.

---

### File Reference Convention

Use project-relative paths in rules and documentation:

```text
src/app/...
src/lib/...
src/services/...
prisma/schema.prisma
```

Do not use absolute local filesystem paths such as:

```text
file:///Users/...
```

unless the environment explicitly supports them.

---

## 3. Command Execution & Tool Usage

### Working Directory

When a command execution tool supports a working-directory/Cwd parameter, use it.

The command should execute from the project root or the appropriate project directory.

---

### No `cd` Commands

Do not use `cd` commands when the execution environment provides a native working-directory parameter.

Prefer:

```text
Working Directory:
project-root
```

then:

```bash
npm run build
```

instead of:

```bash
cd project-root && npm run build
```

---

## 4. Self-Maintaining Living Documentation

All files under:

```text
.agents/rules/*.md
```

are living project documentation.

They should remain consistent with the actual codebase.

Before relying on a rule, inspect the relevant implementation when necessary.

---

### Technical / Documentation Discrepancies

AI may automatically update `.md` files when discrepancies are purely technical/documentation-related and can be verified from the codebase.

Examples:

* file path changes
* directory changes
* function renames
* variable renames
* component renames
* service renames
* API route changes
* Prisma model changes
* Prisma field changes
* TypeScript type/interface changes
* dependency implementation changes

Example:

```text
Rule:
src/services/task.service.ts

Actual:
src/services/task/task.service.ts
```

The documentation may be updated to reflect the verified implementation.

---

### Business Logic & Security Discrepancies

AI MUST NOT automatically change business rules or security policies simply because the implementation differs from the documentation.

Examples:

```text
Task status
Approval workflow
Project roles
Permissions
OTP limits
Account blocking
Notification recipients
Project ownership
Access control
```

When such a discrepancy is found:

```text
Identify discrepancy
        ↓
Inspect actual implementation
        ↓
Compare against written rule
        ↓
Determine whether intended behavior is clear
```

If the intended behavior is ambiguous, ask the user before changing the business/security rule.

Do not modify the `.md` to simply make the documentation match potentially incorrect code.

Do not modify the code to simply make it match potentially outdated documentation without understanding the intended behavior.

---

## 5. Source of Truth

For **business behavior and security policy**, use:

```text
Explicit User Requirement
        ↓
Confirmed Business Requirement
        ↓
Existing Implementation
        ↓
Technical Documentation
```

For **technical facts**, use:

```text
Actual Codebase
        ↓
Project Configuration
        ↓
Technical Documentation
```

Therefore:

* User requirements have priority for requested behavior.
* Confirmed business requirements have priority over implementation.
* Actual codebase is the source of truth for current technical implementation.
* Technical documentation should be updated when verified implementation changes.

---

## 6. Minimal Change Principle

When updating `.md` files:

1. Update only outdated sections.
2. Preserve valid rules.
3. Preserve existing structure where possible.
4. Do not rewrite the entire rule file unnecessarily.
5. Do not change business/security requirements without authorization.

When modifying application code:

1. Change only the necessary files.
2. Preserve existing behavior outside the requested scope.
3. Avoid unrelated refactoring.
4. Verify affected functionality.

---

## 7. Dependency Discipline

Before adding a dependency:

1. Inspect `package.json`.
2. Search for existing functionality.
3. Check whether an existing library already solves the problem.
4. Consider whether native functionality is sufficient.
5. Add a dependency only when there is a justified technical requirement.

Do not introduce duplicate libraries for:

```text
UI
Icons
Validation
HTTP
Database
Authentication
State Management
Email
```

when an existing project solution is suitable.

---

## 8. Business Logic Protection

Business logic must not be changed based on assumptions.

Before modifying behavior related to:

* task workflow
* task status
* project ownership
* permissions
* approval
* notification recipients
* authentication
* OTP
* account blocking
* data access

inspect the relevant rules and implementation first.

If the intended behavior is unclear, do not guess.

---

## 9. Security Boundary

Security must be enforced server-side.

Frontend behavior such as:

```text
hide button
disable button
hide menu
```

is UX behavior, not authorization.

Protected operations must validate server-side:

```text
Authentication
        ↓
Authorization
        ↓
Resource Access
        ↓
Operation
```

Follow detailed security requirements in:

```text
.agents/rules/06-security.md
```

---

## 10. Final Engineering Principle

The purpose of these rules is to keep the project:

```text
Correct
    ↓
Secure
    ↓
Consistent
    ↓
Maintainable
    ↓
Verifiable
```

Do not optimize for the smallest number of changed lines if that would produce an incomplete or fragile solution.

Do not optimize for architectural perfection if that requires unnecessary refactoring.

Solve the actual problem, preserve existing behavior, verify the result, and keep the documentation synchronized with verified technical reality.
