# Task Management Rules

## 1. Domain Constants & Types

### Task Status

Task saat ini memiliki status:

* `BACKLOG`
* `OPEN`
* `IN_PROGRESS`
* `DONE`
* `CLOSED`

`LOCKED` bukan status task.

`LOCKED` hanya merupakan kondisi locking apabila menggunakan field seperti:

```text
isLocked === true
```

Jangan menambahkan status baru tanpa instruksi eksplisit.

Sebelum mengubah status workflow, selalu periksa Prisma schema dan existing implementation.

---

## 2. Task Workflow

Task Management memiliki dua workflow approval yang berbeda:

### Request to Done

Digunakan ketika member ingin menyelesaikan task.

```text
IN_PROGRESS
      ↓
REQUEST TO DONE
      ↓
OWNER REVIEW
      ├── APPROVE → DONE
      └── REJECT  → IN_PROGRESS
```

Endpoint/implementation existing:

```text
/api/tasks/[id]/request-done
/api/tasks/[id]/approve-done
/api/tasks/[id]/reject-done
/api/tasks/[id]/cancel-done
```

Jangan mengubah workflow ini tanpa instruksi eksplisit.

---

### Request to Close

Request to Close merupakan workflow yang berbeda dari Request to Done.

```text
IN_PROGRESS / DONE
      ↓
REQUEST TO CLOSE
      ↓
OWNER REVIEW
      ├── APPROVE → CLOSED
      └── REJECT  → status sebelumnya
```

Endpoint/implementation existing:

```text
/api/tasks/[id]/request-close
/api/tasks/[id]/approve-close
/api/tasks/[id]/reject-close
/api/tasks/[id]/cancel-close
```

Ketika Owner menyetujui Request to Close:

```text
status = CLOSED
closeRequestStatus = APPROVED
closeReviewedById = ownerId
closeReviewedAt = currentDate
```

Jangan mengubah hasil approval Request to Close menjadi `DONE`.

`CLOSED` adalah status valid dalam sistem.

---

## 3. DONE vs CLOSED

`DONE` dan `CLOSED` adalah dua status yang berbeda.

### DONE

Menandakan task telah selesai melalui workflow Request to Done.

### CLOSED

Menandakan task telah ditutup melalui workflow Request to Close.

Jangan menganggap:

```text
DONE === CLOSED
```

Jangan mengganti satu status dengan status lainnya tanpa memahami workflow yang menggunakan status tersebut.

---

## 4. Task Lock & Status Transitions

`LOCKED` bukan merupakan status task.

Locking merupakan kondisi terpisah dari status.

Contoh:

```text
status = DONE
isLocked = true
```

atau:

```text
status = CLOSED
isLocked = true
```

Jika `isTaskDone(task)` atau `isLocked === true`, task harus diperlakukan sebagai read-only sesuai business rule existing.

Backend wajib memvalidasi locking dan status transition sebelum melakukan:

* update
* delete
* perubahan status (menggunakan `isValidStatusTransition(currentStatus, nextStatus)`)
* perubahan assignment
* perubahan priority
* perubahan field task lainnya

Jika operation tidak diperbolehkan:

```text
HTTP 403 Forbidden
```

Gunakan existing helper seperti:

```text
getTaskLockedResponse()
```

atau `getTaskCompletedResponse()`.

Jangan membuat status `LOCKED`.

---

## 5. Request to Close Notification

Ketika member melakukan Request to Close:

Email notification hanya boleh dikirim kepada project owner.

Recipient harus berasal dari:

```text
task.project.owner.email
```

Jangan mengirim email kepada:

* requester
* task creator
* assignee lain
* project member lain
* viewer
* admin lain

Jangan menggunakan fallback recipient lain jika project owner tidak memiliki email.

Gunakan existing notification/email service (`sendTaskCloseNotification` di `src/lib/notification.ts`).

---

## 6. Project Owner

Project owner harus diperoleh dari relasi project.

Jangan menentukan owner berdasarkan:

* current logged-in user
* task creator
* assignee
* first member
* first admin
* requester

Flow:

```text
Task
 ↓
Project
 ↓
Project Owner
 ↓
Owner Email
```

---

## 7. Task Numbering & Activity Logging

Task number dibuat secara otomatis menggunakan existing implementation:

```text
generateNextTaskNumber(tx?)
```

Format:

```text
TSK-000001
TSK-000002
TSK-000003
```

Setiap perubahan task wajib mencatat riwayat aktivitas menggunakan helper existing:

```text
logTaskActivity({ taskId, userId, action, description, fieldName, previousValue, newValue, tx })
```

---

## 8. Pagination & Table Loading

Task table tidak boleh menghilang ketika melakukan:

* pagination
* filtering
* search
* sorting

### Initial Loading

Gunakan state initial loading ketika belum ada task data.

Contoh:

```text
isLoading
```

### Background Fetching

Jika task data sudah tersedia, data sebelumnya harus tetap ditampilkan selama request berlangsung.

Gunakan state terpisah:

```text
isFetching
```

Jangan mengganti seluruh table dengan full-page loading.

### Zero Layout Shift

Selama background fetch:

* jangan unmount table
* jangan menghilangkan `thead`
* jangan menghilangkan `tbody`
* jangan menghilangkan pagination
* jangan mengganti seluruh table dengan spinner

Gunakan loading indicator yang tidak menyebabkan layout shift.

### Pagination

Saat pagination sedang diproses:

```text
isFetching === true
```

pagination controls dapat dinonaktifkan untuk mencegah duplicate request atau rapid double-click.

Setelah request selesai:

```text
isFetching === false
```

Data halaman baru kemudian ditampilkan.

---

## 9. Permission

Semua perubahan task harus melewati validasi:

```text
Authentication
      ↓
Workspace Access
      ↓
Project Access
      ↓
Task Access
      ↓
Permission
      ↓
Lock State
      ↓
Operation
```

Frontend permission hanya untuk UX.

Backend adalah sumber kebenaran authorization.

---

## 10. Existing Implementation First

Sebelum membuat implementation baru:

1. Cari component existing.
2. Cari hook existing.
3. Cari API existing.
4. Cari service existing.
5. Cari helper existing.
6. Cari Prisma schema.
7. Cari database query.
8. Cari permission logic.
9. Cari workflow existing.

Jangan membuat duplicate implementation jika functionality sudah tersedia.

---

## 11. Database Consistency

Prisma schema adalah salah satu sumber kebenaran untuk status task.

Sebelum mengubah status:

1. Periksa Prisma enum.
2. Periksa TypeScript type.
3. Periksa API route.
4. Periksa UI.
5. Periksa workflow yang menggunakan status tersebut.

Jangan menghapus atau mengganti status hanya berdasarkan asumsi.

Jika terdapat perbedaan antara documentation/rules dan codebase, lakukan discrepancy analysis terlebih dahulu.

Jangan mengubah codebase hanya untuk membuatnya sesuai dengan rule tanpa instruksi eksplisit.

---

## 12. Scope Control

Saat mengerjakan Task Management:

* Jangan mengubah workflow existing tanpa instruksi.
* Jangan menghapus status existing.
* Jangan menambahkan status baru tanpa instruksi.
* Jangan mengubah database schema tanpa kebutuhan.
* Jangan mengubah API contract tanpa alasan.
* Jangan melakukan refactor besar tanpa instruksi.
* Jangan mengubah UI yang tidak berkaitan.

Prioritaskan perubahan minimum yang menyelesaikan requirement.

---

## 13. Testing

Setelah perubahan Task Management:

1. Check TypeScript.
2. Check Prisma schema consistency.
3. Check status workflow.
4. Check Request to Done.
5. Check Request to Close.
6. Check DONE behavior.
7. Check CLOSED behavior.
8. Check `isLocked` behavior.
9. Check permission.
10. Check notification recipient jika berkaitan.
11. Check pagination/loading jika berkaitan.
12. Jalankan:

```text
npm run build
```

Jangan menyatakan task selesai jika build masih gagal, kecuali error sudah dipastikan unrelated dan dijelaskan.
