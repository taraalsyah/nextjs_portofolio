---
trigger: always_on
---

# Architecture & Module Boundaries

## 1. Architecture Principles

Project menggunakan modular architecture dengan pemisahan tanggung jawab antara:

```text id="m4x8qa"
Presentation
      ↓
Application / API
      ↓
Business Logic
      ↓
Data Access
      ↓
Infrastructure
```

Architecture harus mengikuti pola existing codebase.

Jangan melakukan refactor atau memindahkan file hanya untuk membuat struktur terlihat lebih ideal jika tidak diperlukan oleh task.

---

## 2. App Router

Location:

```text id="q7n3wp"
src/app/
```

Responsibilities:

* Routing
* Pages
* Layouts
* API Routes
* Request/response handling
* Server/client component boundaries

Pages dan API routes sebaiknya tetap tipis.

Business logic kompleks sebaiknya menggunakan existing service/helper/data-access layer jika memang sudah tersedia.

Namun, jangan memindahkan existing logic secara otomatis hanya untuk mengikuti rule ini.

---

## 3. Services

Location:

```text id="x5m8kc"
src/services/
```

Digunakan untuk reusable application/domain services jika project memang menggunakan layer tersebut.

Contoh:

```text id="p8v3nm"
Task Service
Project Service
Notification Service
Email Service
```

Sebelum membuat service baru:

1. Search existing service.
2. Search `src/lib/`.
3. Search API/server actions.
4. Search existing business logic.
5. Reuse atau extend implementation jika memungkinkan.

Jangan membuat duplicate service.

---

## 4. Lib

Location:

```text id="n4q7xz"
src/lib/
```

Digunakan untuk shared server-side utilities, helpers, configuration, database client, authentication helpers, validation, dan utility functions sesuai existing architecture.

Contoh:

```text id="c8m2vp"
Prisma client
Authentication helper
Validation helper
Utility function
Configuration
```

Jangan menganggap semua business logic harus berada di `src/lib/`.

Jangan membuat file di `lib` hanya karena file tersebut merupakan helper jika existing architecture memiliki lokasi yang lebih tepat.

---

## 5. Components

Location:

```text id="w6k3qa"
src/components/
```

UI components sebaiknya dikelompokkan berdasarkan domain jika component memang domain-specific.

Contoh:

```text id="r8m4xy"
src/components/
├── task-management/
├── project/
├── profile/
└── ui/
```

`ui/` digunakan untuk generic reusable UI components.

Contoh:

```text id="v3q7nm"
Button
Dialog
Input
Select
Table
Spinner
```

Domain-specific component jangan dimasukkan ke `ui/`.

Namun jangan memindahkan component existing hanya untuk memenuhi struktur ini jika tidak diperlukan.

---

## 6. Context

Location:

```text id="z5n8mc"
src/context/
```

Digunakan untuk React Context dan shared client-side state.

Contoh:

```text id="q3m7vx"
ProjectContext.tsx
```

Gunakan Context hanya ketika state memang membutuhkan Context.

Jangan menggunakan Context sebagai pengganti API/server state management tanpa alasan.

---

## 7. Hooks

Location:

```text id="k8v4mp"
src/hooks/
```

Digunakan untuk reusable React hooks.

Contoh:

```text id="f6q2xn"
useProjectMembers.ts
```

Hooks yang menggunakan:

* `useState`
* `useEffect`
* browser APIs
* client-only APIs

harus digunakan dalam Client Component boundary.

Sebelum membuat hook baru, search existing hooks terlebih dahulu.

---

## 8. Server vs Client Components

Gunakan Server Components sebagai default.

Gunakan:

```typescript id="p5x8qk"
'use client'
```

hanya ketika component membutuhkan:

* `useState`
* `useEffect`
* client-only React hooks
* browser APIs
* event handlers
* client-side state
* interactive behavior yang memang membutuhkan client execution

Jangan menggunakan `'use client'` hanya karena child component membutuhkan client functionality.

Pertahankan Client Components sekecil mungkin.

Prefer:

```text id="m7q3vz"
Server Component
      ↓
Small Client Component
```

daripada menjadikan seluruh page sebagai Client Component.

---

## 9. Client / Server Boundary

Client Components tidak boleh mengakses server-only resources secara langsung.

Jangan mengekspos:

* database credentials
* private environment variables
* API secrets
* server-only modules
* privileged database operations

Client harus menggunakan existing mechanism seperti:

```text id="x4n8mq"
API Route
Server Action
Approved Client Data Layer
```

sesuai architecture project.

---

## 10. API Routes

Location:

```text id="q6v3xp"
src/app/api/
```

API routes bertanggung jawab terhadap:

1. Authentication.
2. Authorization.
3. Input validation.
4. Request handling.
5. Calling business/application logic.
6. Response formatting.
7. Error handling.

API route tidak boleh menjadi tempat business logic kompleks jika logic tersebut dapat digunakan kembali.

Namun jangan melakukan refactor hanya untuk memindahkan logic yang tidak bermasalah.

---

## 11. Database Access

Database access harus menggunakan existing database layer.

Sebelum membuat query baru:

1. Search existing query.
2. Search existing service.
3. Search existing repository/data-access function.
4. Check Prisma schema.
5. Check existing relations.
6. Reuse implementation jika memungkinkan.

Jangan membuat duplicate database access logic.

---

## 12. Dependency Direction

Sebisa mungkin dependency mengikuti:

```text id="n7x4qm"
UI
 ↓
Application / API
 ↓
Business Logic
 ↓
Data Access
 ↓
Infrastructure
```

Business logic tidak boleh bergantung pada UI.

Contoh yang harus dihindari:

```text id="m4q8vx"
Service
 ↓
React Component
```

atau:

```text id="c7n2zp"
Database Layer
 ↓
UI Component
```

---

## 13. Cross-Module Communication

Jika satu module membutuhkan functionality module lain, gunakan public interface/service/API yang sudah tersedia.

Contoh:

```text id="x8m3qv"
Task Module
      ↓
Notification Service
      ↓
Email Provider
```

Hindari mengakses internal implementation module lain secara langsung jika public interface sudah tersedia.

Jangan membuat circular dependency antar module.

---

## 14. Shared Components & Utilities

Sebelum membuat component/helper/service baru:

1. Search existing component.
2. Search existing hook.
3. Search existing utility.
4. Search existing service.
5. Search existing API/helper.

Reuse atau extend existing implementation jika memungkinkan.

Jangan membuat duplicate implementation hanya karena nama existing implementation berbeda.

---

## 15. Module Boundaries

Domain utama project dapat mencakup:

```text id="v8m4qx"
Authentication
Project
Task Management
Permissions
Notifications
Workflow
Profile
Administration
Client Portal
```

Daftar tersebut adalah domain reference, bukan instruksi untuk membuat semua module.

Buat module baru hanya jika memang terdapat kebutuhan nyata.

Jangan membuat folder/module hanya untuk memenuhi architecture diagram.

---

## 16. Existing Codebase Is the Source of Truth

Sebelum mengubah architecture:

1. Inspect existing directory structure.
2. Inspect imports.
3. Trace dependencies.
4. Trace API → service → database.
5. Check existing patterns.
6. Check related modules.

Jangan mengasumsikan codebase sudah mengikuti rule ini.

Jika rule berbeda dengan codebase:

```text id="p6q3mz"
Analyze
    ↓
Identify discrepancy
    ↓
Determine whether technical or business
    ↓
Apply appropriate action
```

Technical discrepancy dapat diperbaiki pada documentation jika dapat diverifikasi.

Business architecture/behavior tidak boleh diubah berdasarkan asumsi.

---

## 17. Avoid Premature Refactoring

Jangan melakukan refactor hanya karena:

* file panjang
* folder terlihat tidak rapi
* business logic berada di lokasi yang belum ideal
* ingin menggunakan architecture pattern tertentu

Refactor hanya jika:

* user meminta refactor,
* architecture issue menghambat feature,
* terdapat duplicate logic,
* terdapat security/data-integrity issue,
* atau perubahan memang membutuhkan refactor.

---

## 18. Scope Control

Ketika mengerjakan task:

* Ubah hanya file yang diperlukan.
* Jangan memindahkan file tanpa kebutuhan.
* Jangan rename module tanpa instruksi.
* Jangan mengubah API contract tanpa alasan.
* Jangan mengubah database schema tanpa kebutuhan.
* Jangan melakukan architecture refactor besar tanpa instruksi.

Prioritaskan minimal change yang menyelesaikan requirement.

---

## 19. Shell / Terminal Execution

Saat menjalankan command:

* Jangan menggunakan `cd`.
* Gunakan working directory/Cwd yang sesuai jika tool mendukungnya.
* Jangan menjalankan command dari directory yang salah.

Gunakan:

```text id="c4m8vx"
Working Directory:
project-root
```

Kemudian jalankan command:

```bash id="r7q3nm"
npm run build
```

Hindari:

```bash id="z5x8qp"
cd project-root && npm run build
```

---

## 20. Rule Maintenance

File architecture ini merupakan living documentation.

Jika technical implementation berubah dan rule menjadi outdated, AI boleh memperbarui `.md` secara otomatis jika perubahan tersebut dapat diverifikasi dari codebase.

Contoh:

```text id="m8q4vx"
Rule:
src/services/taskService.ts

Actual:
src/services/tasks/taskService.ts
```

AI boleh memperbarui dokumentasi tersebut.

Namun AI tidak boleh mengubah architecture/business requirement secara sepihak hanya untuk membuat codebase terlihat sesuai dengan documentation.

---

## 21. Final Architecture Principle

Architecture digunakan untuk menjaga:

```text id="x3n7mq"
Maintainability
Security
Separation of Concerns
Reusability
Consistency
```

bukan sebagai tujuan untuk melakukan refactor terus-menerus.

Prioritas:

```text id="q8m4vz"
Correctness
    ↓
Security
    ↓
Existing Business Logic
    ↓
Maintainability
    ↓
Architecture
    ↓
Code Organization
```

Jangan mengorbankan behavior existing hanya untuk membuat struktur folder terlihat lebih bersih.
