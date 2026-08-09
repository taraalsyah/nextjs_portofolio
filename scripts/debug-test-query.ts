import { rerankChunksWithDebug, detectQueryIntent } from "../src/services/vector/vector.service";

// Simulated candidate chunks from document 21 (Task Management PDF)
const mockCandidates = [
    {
        id: "95",
        document_id: 21,
        chunk_index: 8,
        section: "Project: 25",
        content: "[SECTION: Project: 25]\nProject 0: 25\n\n0.33 rg 45 454 Td (maupun Delete) akan ditolak secara mutlak oleh backend dengan mengembalikan respon error HTTP 403 Forbidden via helper getTaskLockedResponse(). 5. Penomoran Otomatis, Audit Trail & Zero Layout Shift - Penomoran Task Otomatis (Auto-Numbering): Setiap tugas baru diberikan nomor unik berurutan secara otomatis melalui transaksi database atomic dengan helper generateNextTaskNumber(tx). Format penomoran menggunakan standar TSK-000001, TSK-000002, dan seterusnya. - Audit Activity Trail (Pencatatan Aktivitas): Setiap perubahan status, pengajuan approval, penolakan, maupun mutasi field diwajibkan mencatat riwayat aktivitas secara otomatis via logTaskActivity(). Log ini mencatat siapa yang melakukan perubahan, kapan dilakukan, serta nilai sebelum dan sesudah perubahan. - Standar UI UX Zero Layout Shift: Pada komponen tabel task frontend, pengambilan data saat pagination atau filtering memisahkan state isLoading (initial fetch) danisFetching (background fetch). Tabel tidak boleh unmount atau menghilang (flicker), menjaga kenyamanan navigasi pengguna tanpa layout shift. Halaman 3 dari 3 - Portfolio Task Management Workflow",
        similarity: 0.3748,
    },
    {
        id: "90",
        document_id: 21,
        chunk_index: 3,
        section: "Project",
        content: "[SECTION: Project]\nHalaman 1 dari 3 - Portfolio Task Management Workflow PENJELASAN DETIL DUAL-APPROVAL WORKFLOWS 3.\n\nAlur Kerja Dual-Approval: Requestto Done & Requestto Close Sistem ini menerapkan dua alur persetujuan terpisah untuk memastikan bahwa tidak ada task yang dapat diselesaikan atau ditutup tanpa melalui pengawasan dan verifikasi resmi: A.\n\nAlur Kerja Requestto Done (Menyelesaikan Pekerjaan Task) Ketika seorang anggota tim yang bertugas (assignee) telah menyelesaikan seluruh kriteria pengerjaan task, dia tidak dapat secara sepihak mengubah status task menjadi DONE.\n\nSebaliknya, anggota tim akan mengirimkan permintaan persetujuan melalui endpoint /api/tasks/[id]/request-done.\n\nTindakan ini akan mengeset atribut doneRequestStatus menjadi PENDING.\n\nSelanjutnya, Project Owner atau Reviewer yang memiliki otoritas akan memeriksa hasil pekerjaan:",
        similarity: 0.3666,
    },
    {
        id: "89",
        document_id: 21,
        chunk_index: 2,
        section: "Project",
        content: "[SECTION: Project]\n- Status BACKLOG: Tahap awal saat tugas baru saja dibuat dalam perencanaan.\n\nTask masih belum ditugaskan secara aktif dan dapat dipindahkanke status OPEN atau IN_PROGRESS.\n\n- Status OPEN: Tugas telah disetujui untuk dikerjakan dan siap diambil atau dialokasikan kepada anggota tim (assignee).\n\nTask pada tahap ini masih bersifat editable.\n\n- Status IN_PROGRESS: Tugas sedang dikerjakan secara aktif oleh anggota tim yang ditunjuk.\n\nPada status ini, assignee dapat mengajukan permohonan persetujuan penyelesaian task (Requestto Done) maupun permohonan penutupan task (Requestto Close).\n\n- Status DONE: Tugas telah selesai dikerjakan dan berhasil disetujui oleh Reviewer atau Project Owner via workflow Requestto Done.\n\nTask dalam status DONE langsung terkunci (isLocked = true) dan menjadi Read-Only.\n\n- Status CLOSED: Tahap akhir dimana tugas ditutup secara permanen via workflow Requestto Close dengan persetujuan Project Owner.\n\nTask ini terkunci penuh dan tidak dapat diubah kembali.\n\nHalaman 1 dari 3 - Portfolio Task Management Workflow PENJELASAN DETIL DUAL-APPROVAL WORKFLOWS 3.",
        similarity: 0.3638,
    },
    {
        id: "88",
        document_id: 21,
        chunk_index: 1,
        section: "Project",
        content: "[SECTION: Project]\n1.\n\nPendahuluan & Gambaran Umum Sistem Sistem Task Management pada aplikasi portofolio Next.jsini dirancang menggunakan arsitektur modern berbasis App Router, TypeScript, dan Prisma ORM dengan basis data MySQL.\n\nSistem ini bertujuan untuk mengelola seluruh tahapan pengerjaan tugas secara terstruktur, transparan, dan aman melalui mekanisme persetujuan berjenjang (dual-approval workflow).\n\nDalam pengembangan aplikasi ini, setiap tugas atau task memiliki siklus hidup yang terdefinisi dengan ketat pada skema database.\n\nPengaturan hak akses dan validasi dilakukan secara mutlak pada sisi server untuk memastikan integritas data dan mencegah manipulasi oleh pihak yang tidak memiliki otorisasi.\n\n2.\n\nPenjelasan 5 Status Lifecycle & Konsep Task Locking Sistem mengenal 5 status resmi task yang disimpandi skema database Prisma, yaitu: BACKLOG, OPEN, IN_PROGRESS, DONE, dan CLOSED.\n\nPenting untuk dipahami bahwa LOCKED bukan merupakan status task tersendiri, melainkan sebuah kondisi proteksi keamanan (isLocked === true) yang aktif secara otomatis apabila sebuah task telah menyelesaikan tahapan persetujuan dan berada pada status DONE atau CLOSED.",
        similarity: 0.4534,
    },
];

const query = "Apakah task management ini sudah deployed ke production?";

console.log("=== INTENT ANALYSIS ===");
console.log(detectQueryIntent(query));

console.log("\n=== RERANK RESULT ===");
const res = rerankChunksWithDebug(query, mockCandidates as any, 5);
console.log("isOutOfScope:", res.isOutOfScope);
console.log("low_confidence:", res.low_confidence);
console.log("isFallback:", res.isFallback);
console.log("fallbackWarning:", res.fallbackWarning);
console.log("Results count:", res.results.length);
if (res.results.length > 0) {
    console.log("Top result:", res.results[0].id, res.results[0].section, "reason:", res.results[0].retrievalReason, "finalScore:", res.results[0].finalScore);
}
