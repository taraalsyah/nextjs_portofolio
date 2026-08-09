import {
    detectQueryIntent,
    rerankChunksWithDebug,
    ChunkSearchResult,
} from "../src/services/vector/vector.service";

// Mock CV Chunks representing Tara's document structure
const MOCK_CV_CHUNKS: ChunkSearchResult[] = [
    {
        id: "chunk-1",
        document_id: "101",
        chunk_index: 0,
        section: "Profile",
        content: "[SECTION: Profile]\nTara Software Engineer dengan 3+ tahun pengalaman dalam web development.",
        chunk_metadata: null,
        title: "CV Tara",
        source: "cv.pdf",
        file_name: "cv_tara.pdf",
        mime_type: "application/pdf",
        similarity: 0.72,
    },
    {
        id: "chunk-2",
        document_id: "101",
        chunk_index: 1,
        section: "Skills",
        content: "[SECTION: Skills]\nTechnical Skills: TypeScript, React, Next.js, Node.js, Python, PostgreSQL, Redis, Docker.",
        chunk_metadata: null,
        title: "CV Tara",
        source: "cv.pdf",
        file_name: "cv_tara.pdf",
        mime_type: "application/pdf",
        similarity: 0.68,
    },
    {
        id: "chunk-3",
        document_id: "101",
        chunk_index: 2,
        section: "Education",
        content: "[SECTION: Education]\nS1 Teknik Informatika - Universitas Dian Nuswantoro (2018 - 2022). IPK 3.75.",
        chunk_metadata: null,
        title: "CV Tara",
        source: "cv.pdf",
        file_name: "cv_tara.pdf",
        mime_type: "application/pdf",
        similarity: 0.75,
    },
    {
        id: "chunk-4",
        document_id: "101",
        chunk_index: 3,
        section: "Projects",
        content: "[SECTION: Projects]\nOverview of all projects:\n1. System Web Ticketing\n2. Email and Telegram Notification\n3. SMSC Knowledge",
        chunk_metadata: null,
        title: "CV Tara",
        source: "cv.pdf",
        file_name: "cv_tara.pdf",
        mime_type: "application/pdf",
        similarity: 0.85,
    },
    {
        id: "chunk-5",
        document_id: "101",
        chunk_index: 4,
        section: "Project: System Web Ticketing",
        content: "[SECTION: Project: System Web Ticketing]\nMengembangkan sistem ticketing berbasis React & Next.js dengan fitur role management dan realtime update.",
        chunk_metadata: null,
        title: "CV Tara",
        source: "cv.pdf",
        file_name: "cv_tara.pdf",
        mime_type: "application/pdf",
        similarity: 0.86,
    },
    {
        id: "chunk-6",
        document_id: "101",
        chunk_index: 5,
        section: "Project: Email and Telegram Notification",
        content: "[SECTION: Project: Email and Telegram Notification]\nMembangun microservice notifikasi otomatis via Email (Nodemailer) & Telegram Bot API.",
        chunk_metadata: null,
        title: "CV Tara",
        source: "cv.pdf",
        file_name: "cv_tara.pdf",
        mime_type: "application/pdf",
        similarity: 0.86,
    },
    {
        id: "chunk-7",
        document_id: "101",
        chunk_index: 6,
        section: "Project: SMSC Knowledge",
        content: "[SECTION: Project: SMSC Knowledge]\nSistem dokumentasi internal dan SMS Gateway protocol knowledge base.",
        chunk_metadata: null,
        title: "CV Tara",
        source: "cv.pdf",
        file_name: "cv_tara.pdf",
        mime_type: "application/pdf",
        similarity: 0.86,
    },
    {
        id: "chunk-8",
        document_id: "101",
        chunk_index: 7,
        section: "Technical Experiences",
        content: "[SECTION: Technical Experiences]\nFullstack Developer di PT Tech Solution (2022 - Sekarang). Membimbing tim dan merancang arsitektur microservices.",
        chunk_metadata: null,
        title: "CV Tara",
        source: "cv.pdf",
        file_name: "cv_tara.pdf",
        mime_type: "application/pdf",
        similarity: 0.70,
    },
    {
        id: "chunk-9",
        document_id: "101",
        chunk_index: 8,
        section: "Languages",
        content: "[SECTION: Languages]\nBahasa Indonesia (Native), English (Professional Working).",
        chunk_metadata: null,
        title: "CV Tara",
        source: "cv.pdf",
        file_name: "cv_tara.pdf",
        mime_type: "application/pdf",
        similarity: 0.50,
    },
    {
        id: "chunk-10",
        document_id: "101",
        chunk_index: 9,
        section: "Github",
        content: "[SECTION: Github]\nGithub Profile: https://github.com/tara-dev",
        chunk_metadata: null,
        title: "CV Tara",
        source: "cv.pdf",
        file_name: "cv_tara.pdf",
        mime_type: "application/pdf",
        similarity: 0.60,
    },
];

const TEST_QUERIES = [
    "Apa saja project yang pernah dikerjakan Tara?",
    "Di mana Tara kuliah?",
    "Apa saja skill Tara?",
    "Di mana Github Tara?",
    "Apa pengalaman kerja Tara?",
    "Apa teknologi yang digunakan pada System Web Ticketing?",
];

console.log("==========================================");
console.log("RAG RETRIEVAL & RERANKING SUITE VERIFICATION");
console.log("==========================================\n");

for (let i = 0; i < TEST_QUERIES.length; i++) {
    const query = TEST_QUERIES[i];
    const intent = detectQueryIntent(query);
    const { results, rejectedCandidates } = rerankChunksWithDebug(query, MOCK_CV_CHUNKS, 5);

    console.log(`TEST CASE ${i + 1}: "${query}"`);
    console.log(`Intent: ${intent.primaryIntent} | isListQuery: ${intent.isListQuery} | TargetEntity: ${intent.targetEntity ?? "None"}`);
    console.log(`Found ${results.length} valid results | ${rejectedCandidates.length} rejected candidates`);
    console.log("RESULTS:");
    results.forEach((r, idx) => {
        console.log(`  ${idx + 1}. Section: "${r.section}" | Reason: ${r.retrievalReason} | Score: ${r.finalScore}`);
    });
    console.log("REJECTED:");
    rejectedCandidates.forEach((rej) => {
        console.log(`  - Section: "${rej.section}" | Reason: ${rej.rejectionReason}`);
    });
    console.log("------------------------------------------\n");
}
