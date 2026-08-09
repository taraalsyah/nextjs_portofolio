---
trigger: always_on
---

# Permission & Approval Workflow Rules

## 1. Authorization Architecture

Application menggunakan dua layer authorization:

### System-Level RBAC

System-level authorization digunakan untuk functionality yang bersifat global, seperti:

* System Administration
* User Management
* Role Management
* System Configuration

Relationship:

```text id="4z7x8a"
User
 ↓
Role
 ↓
Permission
 ↓
RolePermission
```

Jangan menggunakan project role untuk memberikan system-wide permission.

---

### Project-Level Authorization

Project-level authorization digunakan untuk functionality di dalam project.

Project roles:

```text id="j5w8qa"
OWNER
ADMIN
MEMBER
VIEWER
```

Project permission dapat dikonfigurasi melalui existing permission system, termasuk:

```text id="8k3q1p"
ProjectRolePermission
ProjectWorkflowPermission
```

Jangan mengasumsikan semua project role memiliki permission yang sama.

Selalu periksa permission configuration yang berlaku untuk project tersebut.

---

## 2. Authorization Priority

Untuk operation yang berada di dalam project, authorization harus mengikuti:

```text id="2f7m9c"
Authentication
      ↓
Project Membership
      ↓
Project Role
      ↓
Configured Permission
      ↓
Workflow Permission
      ↓
Operation
```

Jangan memberikan permission hanya berdasarkan role name jika project menggunakan configurable permission matrix.

Contoh:

```text id="v5q2nx"
MEMBER
```

tidak otomatis berarti boleh melakukan semua operation yang tersedia untuk member.

---

## 3. Request to Done Workflow

Request to Done adalah workflow approval untuk menyelesaikan task.

Workflow:

```text id="6r3w7p"
IN_PROGRESS
      ↓
REQUEST TO DONE
      ↓
doneRequestStatus = PENDING
      ↓
OWNER / AUTHORIZED REVIEWER
      ├── APPROVE → DONE
      └── REJECT  → IN_PROGRESS
```

Ketika user melakukan Request to Done:

```text id="4q8x1m"
doneRequestStatus = PENDING
```

Task tidak langsung berubah menjadi:

```text id="s7k2vp"
DONE
```

Status hanya berubah menjadi `DONE` setelah request disetujui.

### Important

Task yang sudah `DONE` tidak boleh melakukan Request to Done lagi.

---

## 4. Request to Close Workflow

Request to Close adalah workflow berbeda dari Request to Done.

Workflow:

```text id="8m2v6k"
IN_PROGRESS / DONE
      ↓
REQUEST TO CLOSE
      ↓
closeRequestStatus = PENDING
      ↓
OWNER / AUTHORIZED REVIEWER
      ├── APPROVE → CLOSED
      └── REJECT  → previous valid status
```

Ketika user melakukan Request to Close:

```text id="9x4n2c"
closeRequestStatus = PENDING
```

Task tidak langsung berubah menjadi:

```text id="q8m5yb"
CLOSED
```

Task hanya menjadi `CLOSED` setelah Request to Close disetujui.

---

## 5. Request Submission Permission

User hanya boleh melakukan Request to Done atau Request to Close jika:

1. User authenticated.
2. User merupakan member project.
3. User memiliki permission workflow yang sesuai.
4. Task berada pada status yang valid untuk workflow tersebut.
5. Task tidak locked.
6. Tidak terdapat request pending yang sama.

Jangan memberikan permission hanya karena user mengetahui task ID.

---

## 6. Request to Close Recipient

Request to Close notification memiliki recipient yang sangat ketat.

Recipient harus diselesaikan melalui:

```text id="x7m3pa"
Task
 ↓
Project
 ↓
Project Owner
 ↓
owner.email
```

Email notification **WAJIB hanya dikirim kepada project owner**.

Recipient:

```text id="g2c6vn"
[project.owner.email]
```

Jangan mengirim Request to Close notification kepada:

* requester
* assignee
* task creator
* project member lain
* project admin
* viewer
* system admin

Jangan melakukan fallback recipient.

Jika:

```text id="f8r1yd"
project owner tidak ditemukan
```

atau:

```text id="n3v7km"
project owner tidak memiliki email
```

maka:

1. Log error secara aman.
2. Jangan mengirim email.
3. Jangan mengganti recipient dengan user lain.

---

## 7. Request to Done Notification

Request to Done notification harus mengikuti existing notification configuration.

Jangan mengasumsikan recipient Request to Done sama dengan Request to Close.

Sebelum mengubah recipient:

1. Periksa existing implementation.
2. Periksa workflow permission.
3. Periksa notification service.
4. Pastikan business requirement.

Jangan menambahkan recipient baru tanpa kebutuhan.

---

## 8. Reviewer Authorization

Approval/rejection request harus divalidasi di backend.

Reviewer hanya boleh melakukan approval/rejection jika user memiliki:

```text id="u8f3qk"
OWNER
```

atau:

```text id="v6n2ra"
ADMIN
```

dan permission workflow yang sesuai.

Role saja tidak cukup jika project menggunakan configurable workflow permissions.

---

## 9. Request Ownership

Requester tidak boleh otomatis melakukan approval terhadap request miliknya sendiri hanya karena dia memiliki permission submission.

Pisahkan:

```text id="x3c8zn"
Submitter
```

dan:

```text id="p5v7qm"
Reviewer
```

jika business rule existing mensyaratkan approval oleh pihak lain.

Jangan mengubah approval model tanpa instruksi eksplisit.

---

## 10. Approval Validation

Sebelum approve/reject:

1. Authenticate user.
2. Validate project membership.
3. Validate project role.
4. Validate workflow permission.
5. Validate task existence.
6. Validate request status.
7. Validate task state.
8. Perform approval/rejection.
9. Update task status jika approval berhasil.
10. Record reviewer information.

Contoh data approval:

```text id="k9m4wd"
closeReviewedById
closeReviewedAt
```

atau field equivalent yang sudah digunakan codebase.

Jangan membuat field baru jika existing field sudah tersedia.

---

## 11. Pending Request

Request dengan status:

```text id="z7w2pf"
PENDING
```

harus dianggap sebagai request aktif.

Jangan membuat duplicate request yang sama jika sudah terdapat pending request, kecuali existing business logic memang mengizinkannya.

---

## 12. Backend Authorization Is Mandatory

Frontend permission checks hanya digunakan untuk UX.

Contoh:

```text id="b3m6tx"
Hide Button
Disable Button
```

tidak dianggap sebagai authorization.

Backend API harus tetap memvalidasi:

```text id="n8q4rc"
Authentication
Authorization
Project Membership
Permission
Workflow Permission
Task State
Request State
```

User tidak boleh bypass authorization hanya dengan memanggil API secara langsung.

---

## 13. Permission Changes

Jika user meminta perubahan permission:

1. Cari existing permission implementation.
2. Cari Prisma model terkait.
3. Cari API.
4. Cari UI permission management.
5. Periksa impact terhadap existing roles.
6. Jangan hard-code permission baru jika configurable permission system sudah tersedia.

Jangan membuat permission baru jika existing permission dapat digunakan.

---

## 14. Existing Implementation First

Sebelum membuat authorization atau workflow logic baru:

1. Search existing middleware.
2. Search existing authorization helper.
3. Search project permission service.
4. Search workflow permission service.
5. Search task permission logic.
6. Search request/approval endpoints.
7. Search notification service.

Reuse atau extend existing implementation jika memungkinkan.

Jangan membuat duplicate authorization logic.

---

## 15. Rule Maintenance

Jika terdapat discrepancy antara rule ini dan codebase:

### Technical discrepancy

AI boleh memperbarui `.md` secara otomatis jika discrepancy dapat diverifikasi dan hanya menyangkut dokumentasi teknis.

### Business discrepancy

Jika discrepancy menyangkut:

* permission
* role
* workflow
* approval
* reviewer
* recipient
* authorization behavior

jangan menebak.

Identifikasi discrepancy dan minta konfirmasi jika intended behavior tidak jelas.

---

## 16. Security Principle

Authorization harus selalu dilakukan di server.

Jangan mempercayai:

* role dari request body
* user ID dari client
* project owner ID dari client
* permission dari client
* approval reviewer ID dari client

Identitas user harus diperoleh dari authenticated session/token.

Project role dan permission harus diperoleh dari server-side data.

---

## 17. Final Principle

Permission dan approval harus diperlakukan sebagai **security boundary**, bukan hanya UI behavior.

Frontend:

```text id="y4v6ps"
UX
```

Backend:

```text id="t8k3qm"
Source of Truth
```

Tidak ada user yang boleh melakukan operation yang tidak diizinkan hanya karena UI gagal menyembunyikan atau menonaktifkan tombol.
