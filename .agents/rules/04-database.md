---
trigger: always_on
---

# Database & Prisma Rules

## 1. Prisma Schema Is the Source of Truth

Sebelum membuat atau mengubah database-related code:

1. Baca `prisma/schema.prisma`.
2. Periksa model yang terkait.
3. Periksa enum dan relations.
4. Periksa existing migrations/schema history jika tersedia.
5. Periksa implementation Prisma yang sudah digunakan.

Jangan mengasumsikan struktur database hanya berdasarkan dokumentasi atau nama field.

Jika rule `.md` berbeda dengan Prisma schema, lakukan discrepancy analysis terlebih dahulu.

---

## 2. Schema Conventions

Gunakan convention berikut jika sesuai dengan existing schema.

### Table Names

Gunakan pluralized `snake_case` melalui Prisma `@@map()`.

Contoh:

```text id="q1k4mz"
@@map("tasks")
@@map("projects")
```

### Column Names

Gunakan `snake_case` melalui Prisma `@map()` jika database menggunakan naming convention tersebut.

Contoh:

```text id="o5h3pc"
@map("created_at")
@map("owner_user_id")
```

Jangan mengubah existing table atau column naming hanya untuk mengikuti convention ini jika database sudah berjalan dan perubahan tersebut tidak diperlukan.

---

## 3. Soft Delete

Gunakan soft delete untuk records yang memang membutuhkan lifecycle/recovery/history berdasarkan existing business requirement.

Contoh:

```text id="1j5xqa"
deletedAt DateTime?
```

Namun:

* Jangan menambahkan `deletedAt` secara otomatis ke semua model.
* Jangan mengubah hard delete menjadi soft delete tanpa memahami existing behavior.
* Periksa apakah model tersebut memang membutuhkan soft delete.
* Periksa semua query agar record soft-deleted tidak muncul secara tidak sengaja.

Untuk model yang sudah menggunakan soft delete, query harus memperhatikan:

```text id="n5r8fc"
deletedAt: null
```

kecuali operation tersebut memang membutuhkan deleted records.

---

## 4. Interactive Transactions

Untuk Prisma interactive transaction:

```text id="h9p2vd"
prisma.$transaction(async (tx) => {
  // database operations
})
```

gunakan transaction options yang sesuai dengan kebutuhan project.

Default project configuration:

```typescript id="m4x7ks"
{
  maxWait: 5000,
  timeout: 15000
}
```

Contoh:

```typescript id="g8r2wc"
await prisma.$transaction(
  async (tx) => {
    // database operations
  },
  {
    maxWait: 5000,
    timeout: 15000,
  }
);
```

Jangan mengubah timeout hanya untuk menyembunyikan query yang lambat.

Jika transaction sering timeout:

1. Periksa query yang berjalan.
2. Periksa database performance.
3. Periksa locking.
4. Periksa jumlah operasi di dalam transaction.
5. Periksa apakah transaction terlalu panjang.
6. Optimalkan query terlebih dahulu.
7. Baru pertimbangkan perubahan timeout jika memang diperlukan.

---

## 5. Keep External / Expensive Operations Outside Transactions

Jangan menjalankan operasi non-database yang membutuhkan waktu lama di dalam interactive transaction jika tidak diperlukan.

Hindari di dalam:

```text id="6e7v1m"
prisma.$transaction(async (tx) => {
   ...
})
```

hal seperti:

* `sendEmail()`
* external HTTP request
* API call
* file upload
* file processing
* AI API call
* password hashing yang berat
* operasi network lainnya

### Password Hashing

Jika memungkinkan, lakukan password hashing sebelum transaction:

```text id="7m4x2p"
hash password
      ↓
transaction
      ↓
database write
```

Bukan:

```text id="w2c9fd"
transaction
      ↓
bcrypt.hash()
      ↓
database write
```

Namun, jangan memindahkan operasi keluar transaction secara membabi buta jika hal tersebut menyebabkan race condition atau data inconsistency.

---

## 6. Transaction Scope

Transaction harus dibuat sesingkat mungkin.

Di dalam transaction prioritaskan:

* database reads yang diperlukan
* database writes
* validation yang membutuhkan database state
* operations yang harus atomic

Hindari:

* email sending
* external API request
* AI request
* file processing
* long-running computation
* unnecessary delays

Tujuannya adalah mengurangi:

* lock duration
* connection usage
* transaction timeout
* contention

---

## 7. Atomic Operations

Gunakan transaction ketika beberapa database operations harus berhasil atau gagal sebagai satu unit.

Contoh:

```text id="3j6f8z"
Create Task
+
Create Task History
+
Update related counter
```

Jika ketiganya harus konsisten, gunakan transaction.

Namun jangan menggunakan transaction untuk single database operation jika tidak diperlukan.

---

## 8. Singleton Prisma Client

Gunakan existing Prisma singleton:

```typescript id="8k3v0n"
import prisma from '@/lib/prisma';
```

Jangan membuat:

```typescript id="y4p9zs"
new PrismaClient()
```

di API routes, services, components, atau utility files jika singleton existing sudah tersedia.

Tujuannya untuk mencegah pembuatan terlalu banyak Prisma connections, terutama pada development dan serverless environment.

---

## 9. Database Access Location

Database access harus berada pada server-side code.

Jangan mengakses Prisma langsung dari Client Components.

Gunakan existing pattern seperti:

```text id="7n5xqk"
Client Component
      ↓
API / Server Action
      ↓
Service / Server Logic
      ↓
Prisma
      ↓
Database
```

ikuti architecture existing jika project menggunakan pattern yang berbeda.

---

## 10. Relations & Existing Data

Sebelum mengubah relation:

1. Periksa model yang terkait.
2. Periksa foreign key.
3. Periksa `onDelete`.
4. Periksa existing data.
5. Periksa API yang menggunakan relation.
6. Periksa UI yang bergantung pada relation.

Jangan mengubah relation atau cascade behavior hanya untuk menyelesaikan satu error tanpa memahami impact-nya.

---

## 11. Schema Changes

Jangan mengubah Prisma schema hanya karena sebuah feature dapat dibuat dengan cara tersebut.

Sebelum schema change:

1. Pastikan perubahan memang diperlukan.
2. Periksa apakah field/model sudah tersedia.
3. Periksa apakah existing field dapat digunakan.
4. Periksa API dan service yang terdampak.
5. Periksa migration impact.
6. Periksa backward compatibility.

Schema changes harus dianggap sebagai perubahan yang berpotensi memengaruhi seluruh aplikasi.

---

## 12. Migration Safety

Jangan melakukan destructive database migration tanpa instruksi eksplisit.

Berhati-hati terhadap:

```text id="g8y3md"
DROP TABLE
DROP COLUMN
ALTER COLUMN
DELETE DATA
```

Jika perubahan berpotensi menyebabkan data loss:

1. Identifikasi risiko.
2. Jelaskan impact.
3. Jangan menjalankan destructive operation tanpa konfirmasi.

---

## 13. Query Efficiency

Sebelum menambahkan query:

* Periksa apakah data sudah tersedia dari query existing.
* Hindari N+1 query.
* Gunakan `select` jika hanya membutuhkan field tertentu.
* Gunakan `include` hanya ketika relation memang diperlukan.
* Gunakan pagination untuk dataset besar.
* Hindari mengambil seluruh dataset jika hanya membutuhkan sebagian data.

Jangan melakukan optimasi premature jika belum ada masalah nyata.

---

## 14. Error Handling

Database errors harus ditangani pada layer yang sesuai.

Jangan mengekspos:

* database credentials
* raw connection information
* sensitive query information
* internal stack trace

kepada client.

Gunakan error response yang aman dan sesuai dengan API convention existing.

---

## 15. Existing Database First

Sebelum membuat database implementation baru:

1. Search Prisma model.
2. Search existing query.
3. Search existing service.
4. Search API route.
5. Search helper.
6. Check relation.
7. Check existing transaction.
8. Reuse existing implementation jika memungkinkan.

Jangan membuat duplicate query/service hanya karena belum menemukan implementation existing.

---

## 16. Database Rule Maintenance

File rule ini merupakan living documentation.

Jika ditemukan technical discrepancy antara:

```text id="c5h8aw"
.agents/rules/04-database.md
```

dan:

```text id="5z7nq1"
prisma/schema.prisma
```

AI boleh memperbarui bagian dokumentasi yang sudah outdated secara otomatis jika discrepancy tersebut dapat diverifikasi.

Namun, jika discrepancy menyangkut business behavior atau data model yang belum jelas intended behavior-nya, jangan menebak.

Identifikasi discrepancy dan minta konfirmasi.

---

## 17. Final Verification

Setelah perubahan database-related:

1. Check Prisma schema.
2. Check TypeScript types.
3. Check affected queries.
4. Check relations.
5. Check transaction behavior.
6. Check authorization.
7. Check affected API routes.
8. Check migration impact jika schema berubah.
9. Run project validation/build.

Contoh:

```bash id="p6q2vw"
npm run build
```

Jangan menyatakan database-related task selesai jika perubahan menyebabkan build atau Prisma validation gagal.
