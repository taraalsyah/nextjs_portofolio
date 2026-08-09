import sys
import os

def create_task_management_narrative_pdf(filename):
    # Pure Python PDF Generator for Narrative Task Management Workflow Document
    pdf_content = []
    
    # PDF Header
    pdf_content.append(b"%PDF-1.4")
    
    objects = []
    
    # Obj 1: Catalog
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    
    # Obj 2: Pages (3 Pages for rich narrative text)
    objects.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R] /Count 3 >>\nendobj\n")
    
    # Obj 3: Page 1
    objects.append(b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 6 0 R /F2 7 0 R /F3 8 0 R >> >> /Contents 9 0 R >>\nendobj\n")
    
    # Obj 4: Page 2
    objects.append(b"4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 6 0 R /F2 7 0 R /F3 8 0 R >> >> /Contents 10 0 R >>\nendobj\n")
    
    # Obj 5: Page 3
    objects.append(b"5 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 6 0 R /F2 7 0 R /F3 8 0 R >> >> /Contents 11 0 R >>\nendobj\n")

    # Obj 6: Font F1 (Helvetica Bold)
    objects.append(b"6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n")

    # Obj 7: Font F2 (Helvetica Regular)
    objects.append(b"7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

    # Obj 8: Font F3 (Helvetica Oblique)
    objects.append(b"8 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n")

    # Page 1 Narrative Stream: Introduction & Status Lifecycle
    p1_lines = []
    
    # Header Banner Background
    p1_lines.append("0.06 0.09 0.16 rg") # Dark Slate Navy
    p1_lines.append("30 735 535 80 re f")
    
    # Header Title
    p1_lines.append("BT /F1 18 Tf 1.0 1.0 1.0 rg 45 782 Td (PENJELASAN FLOW KERJA TASK MANAGEMENT) Tj ET")
    p1_lines.append("BT /F2 10 Tf 0.78 0.82 0.99 rg 45 756 Td (Panduan Naratif Alur Kerja, Status Lifecycle & Proteksi Keamanan System - Next.js) Tj ET")
    
    # Section 1: Pendahuluan
    p1_lines.append("BT /F1 13 Tf 0.06 0.09 0.16 rg 30 700 Td (1. Pendahuluan & Gambaran Umum Sistem) Tj ET")
    p1_lines.append("0.39 0.40 0.95 RG 2.0 w 30 693 m 565 693 l S")

    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 675 Td (Sistem Task Management pada aplikasi portofolio Next.js ini dirancang menggunakan arsitektur) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 661 Td (modern berbasis App Router, TypeScript, dan Prisma ORM dengan basis data MySQL. Sistem ini) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 647 Td (bertujuan untuk mengelola seluruh tahapan pengerjaan tugas secara terstruktur, transparan,) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 633 Td (dan aman melalui mekanisme persetujuan berjenjang (dual-approval workflow).) Tj ET")

    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 611 Td (Dalam pengembangan aplikasi ini, setiap tugas atau task memiliki siklus hidup yang terdefinisi) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 597 Td (dengan ketat pada skema database. Pengaturan hak akses dan validasi dilakukan secara mutlak) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 583 Td (pada sisi server untuk memastikan integritas data dan mencegah manipulasi oleh pihak yang tidak) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 569 Td (memiliki otorisasi.) Tj ET")

    # Section 2: Status Lifecycle
    p1_lines.append("BT /F1 13 Tf 0.06 0.09 0.16 rg 30 535 Td (2. Penjelasan 5 Status Lifecycle & Konsep Task Locking) Tj ET")
    p1_lines.append("0.39 0.40 0.95 RG 2.0 w 30 528 m 565 528 l S")

    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 510 Td (Sistem mengenal 5 status resmi task yang disimpan di skema database Prisma, yaitu:) Tj ET")
    p1_lines.append("BT /F1 9.5 Tf 0.06 0.09 0.16 rg 30 496 Td (BACKLOG, OPEN, IN_PROGRESS, DONE, dan CLOSED.) Tj ET")

    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 474 Td (Penting untuk dipahami bahwa LOCKED bukan merupakan status task tersendiri, melainkan sebuah) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 460 Td (kondisi proteksi keamanan (isLocked === true) yang aktif secara otomatis apabila sebuah task) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 446 Td (telah menyelesaikan tahapan persetujuan dan berada pada status DONE atau CLOSED.) Tj ET")

    p1_lines.append("BT /F1 10 Tf 0.06 0.09 0.16 rg 30 422 Td (- Status BACKLOG:) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 130 422 Td (Tahap awal saat tugas baru saja dibuat dalam perencanaan. Task masih) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 408 Td (belum ditugaskan secara aktif dan dapat dipindahkan ke status OPEN atau IN_PROGRESS.) Tj ET")

    p1_lines.append("BT /F1 10 Tf 0.06 0.09 0.16 rg 30 386 Td (- Status OPEN:) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 130 386 Td (Tugas telah disetujui untuk dikerjakan dan siap diambil atau dialokasikan) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 372 Td (kepada anggota tim (assignee). Task pada tahap ini masih bersifat editable.) Tj ET")

    p1_lines.append("BT /F1 10 Tf 0.06 0.09 0.16 rg 30 350 Td (- Status IN_PROGRESS:) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 130 350 Td (Tugas sedang dikerjakan secara aktif oleh anggota tim yang ditunjuk.) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 336 Td (Pada status ini, assignee dapat mengajukan permohonan persetujuan penyelesaian task) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 322 Td ((Request to Done) maupun permohonan penutupan task (Request to Close).) Tj ET")

    p1_lines.append("BT /F1 10 Tf 0.06 0.09 0.16 rg 30 300 Td (- Status DONE:) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 130 300 Td (Tugas telah selesai dikerjakan dan berhasil disetujui oleh Reviewer atau) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 286 Td (Project Owner via workflow Request to Done. Task dalam status DONE langsung terkunci) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 272 Td ((isLocked = true) dan menjadi Read-Only.) Tj ET")

    p1_lines.append("BT /F1 10 Tf 0.06 0.09 0.16 rg 30 250 Td (- Status CLOSED:) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 130 250 Td (Tahap akhir di mana tugas ditutup secara permanen via workflow) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 236 Td (Request to Close dengan persetujuan Project Owner. Task ini terkunci penuh dan tidak dapat) Tj ET")
    p1_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 222 Td (diubah kembali.) Tj ET")

    p1_lines.append("BT /F2 8 Tf 0.58 0.64 0.72 rg 200 30 Td (Halaman 1 dari 3 - Portfolio Task Management Workflow) Tj ET")
    
    stream_p1_data = "\n".join(p1_lines).encode("utf-8")
    objects.append(b"9 0 obj\n<< /Length " + str(len(stream_p1_data)).encode("utf-8") + b" >>\nstream\n" + stream_p1_data + b"\nendstream\nendobj\n")

    # Page 2 Narrative Stream: Dual Approval Workflows & Notification Rules
    p2_lines = []
    
    p2_lines.append("0.06 0.09 0.16 rg")
    p2_lines.append("30 760 535 45 re f")
    p2_lines.append("BT /F1 14 Tf 1.0 1.0 1.0 rg 45 780 Td (PENJELASAN DETIL DUAL-APPROVAL WORKFLOWS) Tj ET")

    # Section 3: Dual Approval Workflows
    p2_lines.append("BT /F1 13 Tf 0.06 0.09 0.16 rg 30 725 Td (3. Alur Kerja Dual-Approval: Request to Done & Request to Close) Tj ET")
    p2_lines.append("0.39 0.40 0.95 RG 2.0 w 30 718 m 565 718 l S")

    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 700 Td (Sistem ini menerapkan dua alur persetujuan terpisah untuk memastikan bahwa tidak ada task yang) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 686 Td (dapat diselesaikan atau ditutup tanpa melalui pengawasan dan verifikasi resmi:) Tj ET")

    # Sub-section 3.1: Request to Done
    p2_lines.append("BT /F1 11 Tf 0.11 0.25 0.69 rg 30 660 Td (A. Alur Kerja Request to Done (Menyelesaikan Pekerjaan Task)) Tj ET")
    
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 642 Td (Ketika seorang anggota tim yang bertugas (assignee) telah menyelesaikan seluruh kriteria pengerjaan) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 628 Td (task, dia tidak dapat secara sepihak mengubah status task menjadi DONE. Sebaliknya, anggota) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 614 Td (tim akan mengirimkan permintaan persetujuan melalui endpoint /api/tasks/[id]/request-done.) Tj ET")

    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 592 Td (Tindakan ini akan mengeset atribut doneRequestStatus menjadi PENDING. Selanjutnya, Project) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 578 Td (Owner atau Reviewer yang memiliki otoritas akan memeriksa hasil pekerjaan:) Tj ET")

    p2_lines.append("BT /F1 9.5 Tf 0.04 0.47 0.34 rg 45 556 Td (1. Apabila Disetujui (Approve):) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 200 556 Td (Status task berubah menjadi DONE, atribut doneRequestStatus) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 45 542 Td (berubah menjadi APPROVED, dan isLocked otomatis di-set true sehingga task menjadi Read-Only.) Tj ET")

    p2_lines.append("BT /F1 9.5 Tf 0.73 0.11 0.11 rg 45 520 Td (2. Apabila Ditolak (Reject):) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 200 520 Td (Status task dikembalikan ke IN_PROGRESS, doneRequestStatus) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 45 506 Td (menjadi REJECTED, dan anggota tim harus melakukan perbaikan sesuai catatan penolakan.) Tj ET")

    # Sub-section 3.2: Request to Close
    p2_lines.append("BT /F1 11 Tf 0.49 0.13 0.80 rg 30 478 Td (B. Alur Kerja Request to Close (Menutup Task secara Permanen)) Tj ET")

    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 460 Td (Request to Close merupakan alur yang berbeda dari Request to Done. Pengajuan penutupan task) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 446 Td (dapat dilakukan baik dari status IN_PROGRESS maupun status DONE melalui endpoint API) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 432 Td (/api/tasks/[id]/request-close, yang mengubah closeRequestStatus menjadi PENDING.) Tj ET")

    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 410 Td (Berbeda dari Request to Done, persetujuan penutupan task HANYA boleh dilakukan oleh Project) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 396 Td (Owner secara langsung. Hasil dari alur persetujuan ini adalah:) Tj ET")

    p2_lines.append("BT /F1 9.5 Tf 0.04 0.47 0.34 rg 45 374 Td (1. Apabila Owner Menyetujui (Approve):) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 230 374 Td (Status task berubah secara mutlak menjadi CLOSED,) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 45 360 Td (closeReviewedById diisi ID Owner, closeReviewedAt mencatat tanggal approval, dan isLocked) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 45 346 Td (bernilai true.) Tj ET")

    p2_lines.append("BT /F1 9.5 Tf 0.73 0.11 0.11 rg 45 324 Td (2. Apabila Owner Menolak (Reject):) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 230 324 Td (Status task dikembalikan persis ke status valid sebelum) Tj ET")
    p2_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 45 310 Td (pengajuan (yaitu IN_PROGRESS atau DONE) dan closeRequestStatus menjadi REJECTED.) Tj ET")

    # Highlight Notification Rule Box
    p2_lines.append("0.97 0.95 1.00 rg 30 185 535 105 re f")
    p2_lines.append("0.60 0.20 0.90 RG 30 185 535 105 re S")
    p2_lines.append("BT /F1 10 Tf 0.49 0.13 0.80 rg 45 270 Td (ATURAN KETAT NOTIFIKASI EMAIL REQUEST TO CLOSE:) Tj ET")
    p2_lines.append("BT /F2 9 Tf 0.20 0.25 0.33 rg 45 252 Td (Saat seorang anggota mengajukan Request to Close, sistem akan memicu layanan pengiriman email) Tj ET")
    p2_lines.append("BT /F2 9 Tf 0.20 0.25 0.33 rg 45 238 Td (notifikasi (sendTaskCloseNotification). Email notifikasi ini WAJIB HANYA dikirimkan kepada) Tj ET")
    p2_lines.append("BT /F1 9 Tf 0.60 0.10 0.10 rg 45 224 Td (Project Owner (task.project.owner.email).) Tj ET")
    p2_lines.append("BT /F2 9 Tf 0.20 0.25 0.33 rg 45 204 Td (Sistem melarang keras pengiriman email kepada requester, creator, assignee lain, atau admin) Tj ET")
    p2_lines.append("BT /F2 9 Tf 0.20 0.25 0.33 rg 45 190 Td (lain guna menjaga kerahasiaan komunikasi dan pengawasan penuh di tangan Project Owner.) Tj ET")

    p2_lines.append("BT /F2 8 Tf 0.58 0.64 0.72 rg 200 30 Td (Halaman 2 dari 3 - Portfolio Task Management Workflow) Tj ET")

    stream_p2_data = "\n".join(p2_lines).encode("utf-8")
    objects.append(b"10 0 obj\n<< /Length " + str(len(stream_p2_data)).encode("utf-8") + b" >>\nstream\n" + stream_p2_data + b"\nendstream\nendobj\n")

    # Page 3 Narrative Stream: Security Guards, Audit Trail & UI UX
    p3_lines = []
    
    p3_lines.append("0.06 0.09 0.16 rg")
    p3_lines.append("30 760 535 45 re f")
    p3_lines.append("BT /F1 14 Tf 1.0 1.0 1.0 rg 45 780 Td (SECURITY BOUNDARY, AUDIT TRAIL & UI UX STANDARDS) Tj ET")

    # Section 4: Security Boundary & Server Authorization
    p3_lines.append("BT /F1 13 Tf 0.06 0.09 0.16 rg 30 725 Td (4. Penjelasan Otorisasi Berlapis & Security Boundary Server) Tj ET")
    p3_lines.append("0.39 0.40 0.95 RG 2.0 w 30 718 m 565 718 l S")

    p3_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 700 Td (Dalam arsitektur sistem ini, keamanan dan otorisasi sepenuhnya dipaksakan pada sisi Server) Tj ET")
    p3_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 686 Td ((Backend). Sesuai dengan prinsip dasar keamanan aplikasi, pemeriksaan otorisasi pada) Tj ET")
    p3_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 672 Td (Frontend UI (seperti menyembunyikan tombol Edit atau mentautkan status disabled) HANYA) Tj ET")
    p3_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 658 Td (berfungsi untuk meningkatkan kenyamanan pengguna (UX) dan BUKAN sebagai benteng keamanan.) Tj ET")

    p3_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 636 Td (Setiap permintaan mutasi data pada API Endpoint harus melewati 6 lapisan verifikasi berurutan:) Tj ET")
    
    p3_lines.append("BT /F1 9 Tf 0.11 0.25 0.69 rg 45 614 Td (1. Authentication Session:) Tj ET")
    p3_lines.append("BT /F2 9 Tf 0.20 0.25 0.33 rg 180 614 Td (Memastikan identitas pengguna terverifikasi via NextAuth session.) Tj ET")

    p3_lines.append("BT /F1 9 Tf 0.11 0.25 0.69 rg 45 596 Td (2. Workspace & Project Access:) Tj ET")
    p3_lines.append("BT /F2 9 Tf 0.20 0.25 0.33 rg 180 596 Td (Memastikan pengguna merupakan anggota aktif dari project terkait.) Tj ET")

    p3_lines.append("BT /F1 9 Tf 0.11 0.25 0.69 rg 45 578 Td (3. Task Object Access:) Tj ET")
    p3_lines.append("BT /F2 9 Tf 0.20 0.25 0.33 rg 180 578 Td (Memastikan task memang berada di bawah project milik pengguna.) Tj ET")

    p3_lines.append("BT /F1 9 Tf 0.11 0.25 0.69 rg 45 560 Td (4. Role & Workflow Permission:) Tj ET")
    p3_lines.append("BT /F2 9 Tf 0.20 0.25 0.33 rg 180 560 Td (Memvalidasi matriks izin peran (Owner, Admin, Member).) Tj ET")

    p3_lines.append("BT /F1 9 Tf 0.11 0.25 0.69 rg 45 542 Td (5. Lock State Verification:) Tj ET")
    p3_lines.append("BT /F2 9 Tf 0.20 0.25 0.33 rg 180 542 Td (Memeriksa apakah isLocked === true atau status DONE/CLOSED.) Tj ET")

    # Red Security Lock Box
    p3_lines.append("1.00 0.95 0.95 rg 30 425 535 95 re f")
    p3_lines.append("0.94 0.27 0.27 RG 30 425 535 95 re S")
    p3_lines.append("BT /F1 10 Tf 0.73 0.11 0.11 rg 45 500 Td (MEKANISME PROTEKSI TASK LOCKING (READ-ONLY GUARD):) Tj ET")
    p3_lines.append("BT /F2 9 Tf 0.20 0.25 0.33 rg 45 482 Td (Apabila sebuah task telah berada pada status DONE atau CLOSED, atau atribut isLocked bernilai) Tj ET")
    p3_lines.append("BT /F2 9 Tf 0.20 0.25 0.33 rg 45 468 Td (true, maka seluruh permintaan pengubahan data (Edit title, description, priority, assignee,) Tj ET")
    p3_lines.append("BT /F2 9 Tf 0.20 0.25 0.33 rg 45 454 Td (maupun Delete) akan ditolak secara mutlak oleh backend dengan mengembalikan respon error) Tj ET")
    p3_lines.append("BT /F1 9 Tf 0.73 0.11 0.11 rg 45 440 Td (HTTP 403 Forbidden via helper getTaskLockedResponse().) Tj ET")

    # Section 5: Numbering, Audit Trail & UI UX
    p3_lines.append("BT /F1 13 Tf 0.06 0.09 0.16 rg 30 390 Td (5. Penomoran Otomatis, Audit Trail & Zero Layout Shift) Tj ET")
    p3_lines.append("0.39 0.40 0.95 RG 2.0 w 30 383 m 565 383 l S")

    p3_lines.append("BT /F1 10 Tf 0.06 0.09 0.16 rg 30 365 Td (- Penomoran Task Otomatis (Auto-Numbering):) Tj ET")
    p3_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 351 Td (Setiap tugas baru diberikan nomor unik berurutan secara otomatis melalui transaksi database) Tj ET")
    p3_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 337 Td (atomic dengan helper generateNextTaskNumber(tx). Format penomoran menggunakan standar) Tj ET")
    p3_lines.append("BT /F1 9.5 Tf 0.06 0.09 0.16 rg 30 323 Td (TSK-000001, TSK-000002, dan seterusnya.) Tj ET")

    p3_lines.append("BT /F1 10 Tf 0.06 0.09 0.16 rg 30 301 Td (- Audit Activity Trail (Pencatatan Aktivitas):) Tj ET")
    p3_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 287 Td (Setiap perubahan status, pengajuan approval, penolakan, maupun mutasi field diwajibkan) Tj ET")
    p3_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 273 Td (mencatat riwayat aktivitas secara otomatis via logTaskActivity(). Log ini mencatat siapa yang) Tj ET")
    p3_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 259 Td (melakukan perubahan, kapan dilakukan, serta nilai sebelum dan sesudah perubahan.) Tj ET")

    p3_lines.append("BT /F1 10 Tf 0.06 0.09 0.16 rg 30 237 Td (- Standar UI UX Zero Layout Shift:) Tj ET")
    p3_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 223 Td (Pada komponen tabel task frontend, pengambilan data saat pagination atau filtering memisahkan) Tj ET")
    p3_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 209 Td (state isLoading (initial fetch) dan isFetching (background fetch). Tabel tidak boleh unmount) Tj ET")
    p3_lines.append("BT /F2 9.5 Tf 0.20 0.25 0.33 rg 30 195 Td (atau menghilang (flicker), menjaga kenyamanan navigasi pengguna tanpa layout shift.) Tj ET")

    p3_lines.append("BT /F2 8 Tf 0.58 0.64 0.72 rg 200 30 Td (Halaman 3 dari 3 - Portfolio Task Management Workflow) Tj ET")

    stream_p3_data = "\n".join(p3_lines).encode("utf-8")
    objects.append(b"11 0 obj\n<< /Length " + str(len(stream_p3_data)).encode("utf-8") + b" >>\nstream\n" + stream_p3_data + b"\nendstream\nendobj\n")

    # Calculate offsets for xref table
    offsets = []
    current_offset = len(pdf_content[0]) + 1
    
    body = b"".join(objects)
    pos = current_offset
    
    xref = [b"xref\n0 12\n0000000000 65535 f \n"]
    
    for obj in objects:
        xref.append(f"{pos:010d} 00000 n \n".encode("utf-8"))
        pos += len(obj)

    trailer = f"trailer\n<< /Size 12 /Root 1 0 R >>\nstartxref\n{pos}\n%%EOF\n".encode("utf-8")

    with open(filename, "wb") as f:
        f.write(pdf_content[0] + b"\n")
        for obj in objects:
            f.write(obj)
        for x in xref:
            f.write(x)
        f.write(trailer)

    print(f"PDF narrative successfully created: {filename}")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "Task_Management_Workflow_Portofolio.pdf"
    create_task_management_narrative_pdf(out)
