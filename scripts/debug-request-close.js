const { rerankChunksWithDebug, detectQueryIntent } = require("./test-enhanced-pipeline");

const STOP_WORDS = new Set([
    "apa","saja","yang","di","ke","dari","ini","itu","siapa","dimana",
    "mana","bagaimana","mengapa","adalah","pada","untuk","oleh","dengan",
    "dan","atau","sebagai","tentang","ada","bisa","sudah","apakah",
    "tersebut","dapat","secara","serta","dalam","hal","kami","saya","tara",
    "berapa","kapan","kenapa","jika",
    "punya","memiliki","memuat","berisi","terdapat","adakah",
    "the","is","a","an","what","where","how","who","which","of","in",
    "on","for","with","and","or","by","to","at","about","show","me",
    "tell","give","list","all","get",
    "when","why","many","much","if",
]);

const DOMAIN_NOISE_TERMS = new Set([
    "task","tasks","management","workflow","project","projects","proyek",
    "portofolio","portfolio","system","sistem","aplikasi","app",
    "digunakan","gunakan","menggunakan","dipakai","pakai","terpakai","memakai","used","using","use",
    "pengerjaan","pekerjaan","proses","fitur","fiturnya","fungsi","fungsionalitas",
    "section","overview","detail","information","info",
]);

const query = "Apakah task management ini punya fitur Request to Close?";
const qL = query.toLowerCase().trim();
const tokens = qL.replace(/[^a-z0-9\s-]/g," ").split(/\s+/).filter(Boolean);
const keyTerms = Array.from(new Set(tokens.filter(t => t.length>2 && !STOP_WORDS.has(t))));
const discriminativeTerms = keyTerms.filter(t => !DOMAIN_NOISE_TERMS.has(t));

console.log("Tokens:", tokens);
console.log("KeyTerms (after stop words):", keyTerms);
console.log("DiscriminativeTerms (after domain noise):", discriminativeTerms);

// Candidate chunks for Request to Close from Doc 21
const mockCandidates = [
    {
        id: "90",
        document_id: 21,
        chunk_index: 3,
        section: "Project",
        content: "[SECTION: Project]\nHalaman 1 dari 3 - Portfolio Task Management Workflow PENJELASAN DETIL DUAL-APPROVAL WORKFLOWS 3.\n\nAlur Kerja Dual-Approval: Requestto Done & Requestto Close Sistem ini menerapkan dua alur persetujuan terpisah untuk memastikan bahwa tidak ada task yang dapat diselesaikan atau ditutup tanpa melalui pengawasan dan verifikasi resmi: A.\n\nAlur Kerja Requestto Done (Menyelesaikan Pekerjaan Task) Ketika seorang anggota tim yang bertugas (assignee) telah menyelesaikan seluruh kriteria pengerjaan task, dia tidak dapat secara sepihak mengubah status task menjadi DONE.\n\nSebaliknya, anggota tim akan mengirimkan permintaan persetujuan melalui endpoint /api/tasks/[id]/request-done.\n\nTindakan ini akan mengeset atribut doneRequestStatus menjadi PENDING.\n\nSelanjutnya, Project Owner atau Reviewer yang memiliki otoritas akan memeriksa hasil pekerjaan:",
        similarity: 0.5239,
    },
    {
        id: "91",
        document_id: 21,
        chunk_index: 4,
        section: "Project",
        content: "[SECTION: Project]\n1. Apabila Disetujui (Approve): Status task berubah menjadi DONE, atribut doneRequestStatus berubah menjadi APPROVED, danisLocked otomatis di-set true sehingga task menjadi Read-Only. 2. Apabila Ditolak (Reject): Status task dikembalikan ke IN_PROGRESS, doneRequestStatus menjadi REJECTED. B. Alur Kerja Requestto Close (Menutup Task secara Permanen) Requestto Close merupakan alur yang berbeda dari Requestto Done. Pengajuan penutupan task dapat dilakukan baik dari status IN_PROGRESS maupun status DONE melalui endpoint /api/tasks/[id]/request-close.",
        similarity: 0.5120,
    },
    {
        id: "92",
        document_id: 21,
        chunk_index: 5,
        section: "Project",
        content: "[SECTION: Project]\nEmail notifikasi Request to Close WAJIB hanya dikirim kepada Project Owner. Notifikasi ini berisi detail penutupan task.",
        similarity: 0.4980,
    }
];

discriminativeTerms.forEach(term => {
    let matches = 0;
    mockCandidates.forEach(c => {
        const text = `${c.section} ${c.content}`.toLowerCase();
        const cnt = text.includes(term) ? 1 : 0;
        if (cnt > 0) matches++;
        console.log(`Term "${term}" in chunk ${c.id}: match=${cnt}`);
    });
    console.log(`Term "${term}" total matches: ${matches}`);
});
