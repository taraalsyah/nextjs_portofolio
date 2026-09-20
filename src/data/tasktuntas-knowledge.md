# DOKUMENTASI & KNOWLEDGE BASE TASKTUNTAS

Dokumentasi ini adalah sumber kebenaran resmi (Source of Truth) mengenai cara penggunaan, fitur, workflow, aturan, dan hak akses di aplikasi **TaskTuntas**.

---

## 1. TENTANG TASKTUNTAS

TaskTuntas adalah platform manajemen tugas (task management) dan proyek (project management) kolaboratif yang dirancang untuk membantu tim dan individu mengelola pekerjaan dengan terstruktur, aman, dan efisien.

### Fitur Utama:
1. **Dashboard & Navigation**: Ringkasan aktivitas, statistik task, project aktif, dan metrik produktivitas.
2. **Project Management**: Pembuatan project, pengelompokan task berdasarkan project, dan manajemen anggota tim.
3. **Task Management**: Pembuatan task, penetapan prioritas, tenggat waktu (due date), kategori task, riwayat aktivitas, dan komentar.
4. **Approval Workflow**: Alur penyelesaian task via *Request to Done* dan *Request to Close*.
5. **Role & Permission Management**: Pengaturan hak akses bertingkat per project (Owner, Admin, Member, Viewer).
6. **AI Assistant & Speech-to-Text**: Asisten cerdas terintegrasi MCP dan Knowledge Base untuk menjawab pertanyaan dan pencarian task via teks maupun input suara (microphone).

---

## 2. MANAJEMEN PROJECT (PROJECT MANAGEMENT)

### Cara Membuat Project Baru
1. Buka menu **Dashboard** atau halaman **Projects**.
2. Klik tombol **+ Tambah Project** atau **Buat Project Baru**.
3. Isi informasi project:
   - **Nama Project**: Nama unik untuk membedakan project.
   - **Deskripsi Project**: Penjelasan singkat mengenai tujuan project.
4. Klik **Simpan** / **Buat Project**.

### Mengundang Anggota (Invite Member) ke Project
- Pembatasan Hak Akses: Hanya pengguna dengan role **OWNER** atau **ADMIN** di project tersebut yang dapat mengundang anggota baru.
- Langkah-langkah:
  1. Masuk ke halaman detail project.
  2. Buka tab **Anggota** / **Members** atau klik tombol **Invite Member**.
  3. Masukkan alamat email pengguna yang akan diundang.
  4. Pilih role project yang diberikan: **ADMIN**, **MEMBER**, atau **VIEWER**.
  5. Klik **Kirim Undangan** / **Invite**.

---

## 3. MANAJEMEN TASK (TASK MANAGEMENT)

### Cara Membuat Task Baru
1. Masuk ke project tempat task akan dibuat.
2. Klik tombol **+ Tambah Task** / **Buat Task Baru**.
3. Isi bidang-bidang berikut:
   - **Judul Task (Title)**: Ringkasan singkat tugas.
   - **Deskripsi**: Penjelasan detail tugas (mendukung teks/markdown).
   - **Prioritas (Priority)**: `HIGH` (Tinggi), `MEDIUM` (Sedang), atau `LOW` (Rendah).
   - **Tenggat Waktu (Due Date)**: Tanggal dan waktu penyelesaian.
   - **Assignee**: Anggota tim yang ditugaskan mengerjakan task.
   - **Kategori Task**: Label/kategori pengelompokan task (opsional).
4. Klik **Simpan Task**.

### Struktur Kode Task (Task Number)
Setiap task di TaskTuntas mendapatkan kode unik otomatis, contohnya `TSK-930002` atau format identifikasi task `A-1234`. Kode ini digunakan untuk pencarian cepat dan referensi detail task.

### Cara Mengedit Task
1. Buka detail task yang ingin diubah.
2. Klik tombol **Edit** / Icon Pensil.
3. Ubah informasi yang diperlukan (judul, deskripsi, priority, assignee, due date, kategori).
4. Klik **Simpan Perubahan**.

---

## 4. WORKFLOW & STATUS TASK

Status task di TaskTuntas mencerminkan siklus hidup pekerjaan:

| Status | Penjelasan |
| :--- | :--- |
| **BACKLOG** | Task baru direncanakan, belum dimulai. |
| **OPEN** | Task telah disetujui dan siap dikerjakan. |
| **IN_PROGRESS** | Task sedang dikerjakan oleh assignee. |
| **DONE** | Task telah selesai dikerjakan dan disetujui oleh reviewer/owner. |
| **CLOSED** | Task telah ditutup sepenuhnya dan tidak memerlukan tindakan lanjutan. |

---

### Workflow Penyelesaian Task (Approval Workflows)

#### 1. Workflow Request to Done (Pengajuan Selesai)
Task tidak langsung berubah dari `IN_PROGRESS` menjadi `DONE` secara otomatis oleh assignee biasa.
- **Langkah 1**: Assignee/Member yang mengerjakan task mengajukan status **Request to Done**.
- **Langkah 2**: Status permohonan menjadi `doneRequestStatus = PENDING`.
- **Langkah 3**: Pengguna dengan role **OWNER** atau **ADMIN** (Authorized Reviewer) menerima notifikasi dan melakukan peninjauan.
- **Langkah 4**:
  - Jika **Disetujui (Approve)**: Status task berubah menjadi **DONE**, dan waktu penyelesaian dicatat (`doneReviewedAt`).
  - Jika **Ditolak (Reject)**: Status task kembali ke **IN_PROGRESS** beserta alasan penolakan.

> **Catatan**: Task yang sudah berstatus `DONE` tidak dapat diajukan *Request to Done* kembali.

#### 2. Workflow Request to Close (Pengajuan Penutupan Task)
Digunakan untuk menutup task berstatus `IN_PROGRESS` atau `DONE` secara permanen.
- **Langkah 1**: Member/Admin mengajukan **Request to Close**.
- **Langkah 2**: Permohonan berstatus `closeRequestStatus = PENDING`.
- **Langkah 3**: Notifikasi permohonan **WAJIB hanya dikirimkan kepada Project OWNER**.
- **Langkah 4**:
  - Jika **Project Owner menyetujui**: Status task berubah menjadi **CLOSED**.
  - Jika **Ditolak**: Status task kembali ke status valid sebelumnya.

---

## 5. PROJECT ROLES & PERMISSIONS (MATRIKS HAK AKSES)

TaskTuntas menerapkan dua tingkatan otorisasi: Otorisasi tingkat Sistem (System-wide RBAC) dan Otorisasi tingkat Project (Project-level Authorization).

### Tingkat Role Project:

#### 1. OWNER (Pemilik Project)
- Memiliki kontrol penuh atas project.
- Dapat mengedit detail project dan menghapus project.
- Dapat mengundang, mengubah role, dan menghapus anggota project.
- Memiliki hak penuh melakukan Review & Approval untuk *Request to Done* dan *Request to Close*.
- Menerima notifikasi khusus permohonan *Request to Close*.

#### 2. ADMIN (Administrator Project)
- Dapat membuat, mengedit, dan menghapus task di dalam project.
- Dapat mengundang anggota baru ke dalam project.
- Dapat menyetujui permohonan *Request to Done*.
- Tidak dapat menghapus project atau mengubah role Owner.

#### 3. MEMBER (Anggota Tim)
- Dapat membuat task baru di dalam project.
- Dapat mengerjakan task yang ditugaskan kepadanya.
- Dapat memperbarui status task menjadi `IN_PROGRESS`.
- Dapat mengajukan permohonan *Request to Done* dan *Request to Close*.
- Tidak dapat mengundang anggota atau mengubah pengaturan project.

#### 4. VIEWER (Pengamat)
- Akses **baca saja (read-only)**.
- Dapat melihat daftar project, daftar task, detail task, dan aktivitas.
- Tidak dapat membuat, mengedit, menghapus, atau mengubah status task.

---

## 6. FITUR AI ASSISTANT & SPEECH-TO-TEXT

### AI Assistant (TaskTuntas AI)
Asisten virtual yang dapat membantu pengguna dalam dua hal:
1. **Dokumentasi & Cara Penggunaan (Knowledge Base)**: Menjawab pertanyaan seputar fitur, role, workflow, permission, dan panduan TaskTuntas.
2. **Data Aktual & Database (MCP)**: Mencari task, melihat jumlah task, mengecek task overdue, atau menampilkan task yang ditugaskan ke pengguna berdasarkan data riil dari database.

### Input Suara (Speech-to-Text)
- Tombol microphone 🎤 tersedia pada kotak input AI Chat.
- Fitur menggunakan Web Speech API bawaan browser dalam Bahasa Indonesia (`lang = "id-ID"`).
- Pengguna dapat berbicara, dan suara diubah menjadi teks secara langsung tanpa menghapus teks yang sudah diketik sebelumnya.
- Teks hasil transkripsi tetap dapat diedit secara manual sebelum dikirimkan ke AI.

---

## 7. ATURAN PENANGANAN INFORMASI

- **Batas Informasi**: AI Assistant hanya memberikan panduan aplikasi berdasarkan dokumentasi ini dan data riil dari MCP database.
- **Informasi Tidak Tersedia**: Jika pertanyaan pengguna mengenai aplikasi tidak tercantum dalam Knowledge Base dan tidak ada di database, AI akan secara jujur menyatakan bahwa informasi tersebut belum tersedia, bukan mengarang jawaban.
