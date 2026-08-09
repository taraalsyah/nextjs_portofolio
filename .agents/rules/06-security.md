---
trigger: always_on
---

# Security & Authentication Rules

## 1. Authentication Is Mandatory

Semua protected resources harus melakukan server-side authentication.

Untuk dashboard dan protected API endpoints, gunakan existing NextAuth authentication mechanism:

```typescript
getServerSession(authOptions)
```

Jangan menganggap user authenticated hanya berdasarkan data dari client.

Client-side session state:

```text id="x4m8qn"
useSession()
```

hanya digunakan untuk UI/UX.

Server-side session:

```text id="p7k3vz"
getServerSession(authOptions)
```

adalah source of truth untuk authentication.

---

## 2. Never Trust Client Identity

Jangan mempercayai identity yang dikirim oleh client seperti:

```text id="f5n2qm"
userId
ownerId
memberId
role
permission
projectOwnerId
reviewerId
```

jika informasi tersebut seharusnya berasal dari authenticated session atau database.

User identity harus diperoleh dari authenticated server session.

Contoh:

```typescript id="w8q3mc"
const session = await getServerSession(authOptions);
const sessionUserId = session?.user?.id;
```

Jangan menggunakan:

```typescript id="v3k7qa"
const userId = body.userId;
```

sebagai dasar authorization.

---

## 3. Authentication vs Authorization

Authentication:

```text id="n6m2xr"
"Who is this user?"
```

Authorization:

```text id="q8v4kp"
"Is this user allowed to perform this operation?"
```

Keduanya harus divalidasi.

Contoh:

```text id="r3x7mz"
Authenticated User
        ↓
Project Membership
        ↓
Project Role
        ↓
Permission
        ↓
Workflow Permission
        ↓
Operation
```

Jangan menganggap authenticated user otomatis memiliki access ke seluruh project.

---

## 4. Project Access Validation

Sebelum membaca atau memodifikasi project/task resources, server harus memvalidasi project context dan membership.

Gunakan existing authorization helpers jika tersedia, seperti:

```text id="c5n8wp"
getActiveProjectContext()
getProjectMember()
```

atau equivalent implementation yang sudah ada.

Validation harus memastikan:

1. User authenticated.
2. Project exists.
3. User memiliki membership yang valid.
4. User memiliki permission yang sesuai.
5. Resource memang berada pada project yang boleh diakses user.

Jangan hanya memvalidasi:

```text id="b7q2vm"
taskId
```

tanpa memastikan task tersebut berada pada project yang dapat diakses user.

---

## 5. Object-Level Authorization

Setiap resource access harus melakukan authorization terhadap resource tersebut.

Contoh:

```text id="m8k4zc"
GET /api/tasks/[id]
```

tidak cukup hanya memeriksa:

```text id="j3v6qp"
session exists
```

Harus memastikan:

```text id="y7n2kx"
User
 ↓
Project Membership
 ↓
Task belongs to Project
 ↓
Permission
 ↓
Allow / Deny
```

Hal ini mencegah IDOR/BOLA, yaitu user mengakses resource hanya dengan mengganti ID.

---

## 6. API Security

Setiap protected API endpoint harus melakukan server-side validation terhadap:

* Authentication
* Authorization
* Input
* Resource ownership/membership
* Permission
* Workflow state jika relevan

Jangan mengandalkan frontend untuk security.

Contoh frontend:

```text id="z5m8rx"
Hide Delete Button
```

bukan security control.

Backend tetap harus menolak unauthorized request.

---

## 7. Input Validation

Semua input dari client harus dianggap untrusted.

Validasi:

* request body
* query parameters
* route parameters
* form data
* IDs
* enum values
* pagination
* filters
* uploaded data

Gunakan existing validation library/pattern jika project sudah memilikinya.

Jangan langsung memasukkan input client ke database tanpa validation.

---

## 8. OTP Security

OTP verification harus memiliki protection terhadap brute-force attempts.

Default policy untuk OTP verification:

```text id="q4m7xp"
Maximum failed attempts: 5
```

Setelah batas tersebut tercapai:

```text id="k8v3nz"
otpSoftBlockUntil
```

digunakan untuk memberikan Soft Block selama:

```text id="w2m6qa"
3 hours
```

Selama Soft Block aktif, OTP verification harus ditolak.

---

## 9. OTP Scope

OTP attempt tracking harus memiliki scope yang jelas.

Jangan menggunakan satu counter global untuk seluruh jenis OTP.

OTP security harus mempertimbangkan minimal:

```text id="n7x3kp"
User / Account
+
OTP Purpose
+
Verification Context
```

Contoh purpose:

```text id="p5m8vc"
LOGIN
EMAIL_VERIFICATION
PASSWORD_RESET
```

Jika implementation existing memiliki OTP purpose berbeda, ikuti existing model.

Jangan mencampur attempt counter antar OTP purpose tanpa alasan.

---

## 10. OTP Attempt Handling

Failed OTP attempt harus dicatat secara atomic untuk mencegah race condition.

Contoh:

```text id="x6q2mz"
OTP Request
      ↓
Validate active OTP
      ↓
Validate soft block
      ↓
Validate attempt limit
      ↓
Compare OTP
      ↓
Success / Failed Attempt
```

Jangan mengandalkan client-side counter.

Counter harus berada pada trusted server-side storage.

---

## 11. OTP Soft Block

Setelah maximum failed attempts tercapai:

```text id="c8v4qn"
otpSoftBlockUntil = currentTime + 3 hours
```

Selama `otpSoftBlockUntil` masih aktif:

```text id="z7m2kp"
OTP verification → DENY
```

Jangan mengizinkan client mengubah atau menghapus `otpSoftBlockUntil`.

---

## 12. Permanent Block

Jika account telah mencapai:

```text id="h5x8mr"
3 Soft Blocks
```

user dapat diberikan permanent account status:

```text id="q3n7vz"
BLOCKED
```

Permanent block harus dilakukan server-side.

Jangan mengubah status user menjadi `BLOCKED` hanya berdasarkan data yang dikirim client.

---

## 13. Admin Unblock

User dengan status:

```text id="m8q4xc"
BLOCKED
```

hanya dapat di-unblock oleh System Administrator sesuai existing system-level permission.

Jangan memberikan kemampuan unblock berdasarkan project role.

Project:

```text id="r5k7np"
OWNER
ADMIN
```

tidak otomatis memiliki permission untuk unblock system-level account.

---

## 14. Rate Limiting

Authentication dan security-sensitive endpoints harus memiliki rate limiting yang sesuai.

Minimal pertimbangkan:

* IP address
* Account/user identifier
* Endpoint
* Authentication state
* Action type

Untuk aplikasi serverless seperti Vercel, jangan menggunakan in-memory `Map()` sebagai satu-satunya rate limiter.

Gunakan shared persistent storage yang mendukung atomic operations, seperti existing Redis implementation jika tersedia.

Contoh pattern:

```text id="v4n8qx"
INCR rate-limit-key
+
EXPIRE rate-limit-key
```

Rate limit harus bekerja walaupun request diproses oleh instance/serverless function yang berbeda.

---

## 15. Login Brute-Force Protection

Login endpoint harus memiliki protection terhadap repeated failed authentication attempts.

Jangan hanya melakukan rate limiting berdasarkan IP.

Pertimbangkan kombinasi:

```text id="k7m3wp"
IP
+
Account Identifier
+
Endpoint
+
Time Window
```

Unknown/nonexistent accounts tetap harus diperlakukan secara aman.

Jangan membocorkan apakah sebuah email/account terdaftar hanya melalui error message yang berbeda.

---

## 16. Password Security

Password harus:

* tidak pernah disimpan plaintext
* tidak pernah dimasukkan ke logs
* di-hash menggunakan existing secure password hashing implementation
* tidak dikirim kembali ke client

Jangan membuat custom password hashing algorithm.

Jika project sudah menggunakan bcrypt atau equivalent secure hashing implementation, reuse existing implementation.

---

## 17. Sensitive Data Logging

Jangan pernah log:

```text id="q6x8mv"
Passwords
Raw OTP codes
API keys
API tokens
JWT secrets
Session secrets
Database credentials
Private keys
Authentication tokens
```

Jangan menaruh sensitive credentials di:

```text id="c7n4pz"
console.log()
console.error()
activity logs
audit descriptions
API responses
```

---

## 18. Safe Debug Logging

Debug information harus menggunakan metadata yang aman.

Contoh acceptable:

```text id="w3m8kx"
Task ID
Project ID
Project Name
Project Owner ID
Recipient Email
Request ID
Workflow Status
```

Tetap hindari logging data yang tidak diperlukan.

Contoh:

```typescript id="p8q2vn"
console.log({
  taskId,
  projectId,
  recipientEmail,
});
```

lebih baik daripada logging seluruh request/session object.

Jangan menggunakan:

```typescript id="m4x7zc"
console.log(session);
console.log(req.body);
console.log(token);
```

jika object tersebut berpotensi mengandung sensitive information.

---

## 19. Error Responses

Jangan mengirim internal implementation details kepada client.

Hindari response yang membocorkan:

* stack trace
* database query
* database schema
* credentials
* internal file path
* secret configuration
* sensitive user information

Gunakan error response yang aman dan konsisten dengan existing API convention.

Detail error dapat dicatat server-side menggunakan safe logging.

---

## 20. Secrets & Environment Variables

Secrets harus disimpan melalui environment variables atau existing secret-management mechanism.

Jangan hard-code:

```text id="n6q3wr"
API keys
Database passwords
JWT secrets
SMTP credentials
OAuth secrets
Encryption keys
```

Jangan menggunakan `NEXT_PUBLIC_` untuk secret yang harus tetap server-side.

Semua variable dengan prefix `NEXT_PUBLIC_` harus dianggap potentially exposed ke client.

---

## 21. Security-Sensitive Changes

Untuk perubahan yang menyangkut:

* authentication
* authorization
* OTP
* password
* session
* rate limiting
* permissions
* secrets
* database access control

jangan melakukan broad refactor tanpa kebutuhan.

Prioritaskan:

```text id="r7m3qx"
Minimal Change
+
Backward Compatibility
+
Security
+
Verification
```

---

## 22. Rule Maintenance

File rule ini merupakan living documentation.

Jika ditemukan technical discrepancy antara rule dan actual implementation, AI boleh memperbarui `.md` secara otomatis jika discrepancy dapat diverifikasi.

Contoh:

```text id="x8q5nm"
Rule:
OTP limit = 5

Implementation:
OTP limit = 5
```

tidak ada perubahan.

Namun jika nama helper, file path, atau technical implementation berubah, dokumentasi dapat diperbarui.

Untuk perubahan security policy atau business/security behavior seperti:

* jumlah OTP attempts
* durasi block
* permanent block threshold
* authentication mechanism
* authorization model
* rate limit policy

AI tidak boleh mengubah rule secara sepihak hanya berdasarkan asumsi.

---

## 23. Security Verification

Setelah security-related changes:

1. Verify authentication.
2. Verify authorization.
3. Verify project membership.
4. Verify object-level access.
5. Verify input validation.
6. Verify rate limiting jika relevan.
7. Verify sensitive data is not logged.
8. Verify error responses.
9. Run TypeScript/build validation.
10. Test unauthorized access scenarios.

Minimal test scenarios:

```text id="c4m8vy"
Unauthenticated user
Unauthorized project member
Wrong project
Wrong role
Insufficient permission
Invalid resource ID
Repeated failed authentication
Repeated failed OTP
Blocked user
Admin unblock
```

---

## 24. Final Security Principle

Security must be enforced server-side.

```text id="z7n3qx"
Frontend
    ↓
UX only

Backend
    ↓
Authentication
    ↓
Authorization
    ↓
Validation
    ↓
Resource Access
```

Tidak ada security boundary yang boleh bergantung hanya pada frontend.
