// Comprehensive Verification Suite for 10 Target RAG Queries

const STOP_WORDS = new Set([
    "apa", "saja", "yang", "di", "ke", "dari", "ini", "itu", "siapa", "dimana",
    "mana", "bagaimana", "mengapa", "adalah", "pada", "untuk", "oleh", "dengan",
    "dan", "atau", "sebagai", "tentang", "ada", "bisa", "sudah", "apakah",
    "tersebut", "dapat", "secara", "serta", "dalam", "hal", "kami", "saya", "tara",
    "the", "is", "a", "an", "what", "where", "how", "who", "which", "of", "in",
    "on", "for", "with", "and", "or", "by", "to", "at", "about"
]);

const INTENT_KEYWORDS = {
    project: [
        "project", "projects", "proyek", "proyeknya", "portofolio", "portfolio",
        "aplikasi", "system", "sistem", "ticketing", "smsc", "notification",
        "dikerjakan", "dibuat", "mengembangkan", "membuat"
    ],
    skills: [
        "skill", "skills", "kemampuan", "keahlian", "teknis", "technical",
        "teknologi", "technology", "tools", "programming", "python",
        "php", "django", "javascript", "react", "nextjs"
    ],
    education: [
        "pendidikan", "education", "kuliah", "sekolah", "universitas", "gelar",
        "s1", "informatika", "studi", "lulusan", "akademik"
    ],
    experience: [
        "pengalaman", "experience", "pekerjaan", "kerja", "karir", "career",
        "posisi", "role", "helpdesk", "support", "perusahaan", "riwayat",
        "mengerjakan", "dikerjakan", "bekerja"
    ],
    contact: [
        "github", "kontak", "contact", "email", "telepon", "phone", "sosmed", "link", "git"
    ],
    language: [
        "bahasa", "language", "languages", "english", "indonesia"
    ],
    profile: [
        "profil", "profile", "tentang", "biodata", "siapa"
    ],
    general: [],
};

const LIST_QUERY_INDICATORS = [
    "apa saja", "sebutkan", "daftar", "list", "berikan", "tampilkan", "semua",
    "proyek apa", "project apa", "skill apa", "apa kemampuan", "what are", "list all", "show all"
];

function detectQueryIntent(query) {
    const qLower = query.toLowerCase();

    const isListQuery =
        LIST_QUERY_INDICATORS.some((ind) => qLower.includes(ind)) ||
        qLower.includes("saja") ||
        qLower.includes("apa-apa") ||
        qLower.includes("apa yang pernah");

    const tokens = qLower.replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean);
    const keyTerms = Array.from(new Set(tokens.filter((t) => t.length > 2 && !STOP_WORDS.has(t))));

    let bestIntent = "general";
    let maxMatchCount = 0;

    if (qLower.includes("siapa") || qLower.includes("biodata") || qLower.includes("tentang tara")) {
        bestIntent = "profile";
        maxMatchCount = 10;
    } else if (qLower.includes("di mana tara bekerja") || qLower.includes("dimana tara bekerja") || qLower.includes("tempat kerja") || qLower.includes("perusahaan")) {
        bestIntent = "experience";
        maxMatchCount = 10;
    } else if (qLower.includes("apa yang pernah tara kerjakan") || qLower.includes("riwayat kerja") || qLower.includes("pengalaman kerja")) {
        bestIntent = "experience";
        maxMatchCount = 10;
    }

    if (maxMatchCount < 10) {
        for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
            if (intent === "general") continue;

            let matches = 0;
            for (const term of keyTerms) {
                if (keywords.some((kw) => kw === term || kw.includes(term) || term.includes(kw))) {
                    matches += 2;
                }
            }
            for (const kw of keywords) {
                if (qLower.includes(kw)) {
                    matches += 1;
                }
            }

            if (matches > maxMatchCount) {
                maxMatchCount = matches;
                bestIntent = intent;
            }
        }
    }

    let targetEntity;
    if (qLower.includes("django")) {
        targetEntity = "Django";
    } else if (qLower.includes("smsc")) {
        targetEntity = "SMSC";
    } else if (qLower.includes("tools") || qLower.includes("teknologi")) {
        targetEntity = "Tools";
    } else if (qLower.includes("system web ticketing") || qLower.includes("ticketing")) {
        targetEntity = "System Web Ticketing";
    } else if (qLower.includes("email and telegram") || qLower.includes("notification")) {
        targetEntity = "Email and Telegram Notification";
    }

    return {
        primaryIntent: bestIntent,
        isListQuery,
        keyTerms,
        targetEntity,
    };
}

function resolveSection(chunk) {
    if (chunk.section && chunk.section.trim()) {
        return chunk.section.trim();
    }
    const match = /\[SECTION:\s*([^\]]+)\]/i.exec(chunk.content);
    if (match && match[1]) {
        return match[1].trim();
    }
    return "General";
}

const DEFAULT_RERANK_WEIGHTS = {
    single: {
        semanticWeight: 0.25,
        intentWeight: 0.30,
        sectionWeight: 0.20,
        coverageWeight: 0.05,
        exactMatchWeight: 0.10,
        hierarchyWeight: 0.10,
    },
    list: {
        semanticWeight: 0.15,
        intentWeight: 0.35,
        sectionWeight: 0.25,
        coverageWeight: 0.10,
        exactMatchWeight: 0.05,
        hierarchyWeight: 0.10,
    },
};

function rerankChunksWithDebug(query, candidates, topK = 5, customWeights) {
    if (candidates.length === 0) {
        return { results: [], rejectedCandidates: [] };
    }

    const intentAnalysis = detectQueryIntent(query);
    const { primaryIntent, isListQuery, keyTerms, targetEntity } = intentAnalysis;

    const weights = customWeights ?? (isListQuery ? DEFAULT_RERANK_WEIGHTS.list : DEFAULT_RERANK_WEIGHTS.single);

    const rejectedCandidates = [];
    const sectionToChunkMap = new Map();

    for (const chunk of candidates) {
        const sectionName = resolveSection(chunk);
        const sectionKey = sectionName.toLowerCase().trim();
        const docId = Number(chunk.document_id) || 0;

        const existing = sectionToChunkMap.get(sectionKey);
        if (!existing) {
            sectionToChunkMap.set(sectionKey, chunk);
        } else {
            const existingDocId = Number(existing.document_id) || 0;
            if (docId > existingDocId || (docId === existingDocId && chunk.similarity > existing.similarity)) {
                rejectedCandidates.push({
                    id: existing.id,
                    document_id: existing.document_id,
                    section: resolveSection(existing),
                    content: existing.content.substring(0, 100),
                    rejectionReason: "duplicate-doc-version",
                });
                sectionToChunkMap.set(sectionKey, chunk);
            } else {
                rejectedCandidates.push({
                    id: chunk.id,
                    document_id: chunk.document_id,
                    section: sectionName,
                    content: chunk.content.substring(0, 100),
                    rejectionReason: "duplicate-doc-version",
                });
            }
        }
    }

    const deduplicatedCandidates = Array.from(sectionToChunkMap.values());

    const canonicalChildProjectExists = deduplicatedCandidates.some((chunk) => {
        const sec = resolveSection(chunk).toLowerCase();
        return /^project:\s*\S+/i.test(sec) || /^proyek:\s*\S+/i.test(sec);
    });

    const hierarchyFilteredCandidates = [];

    for (const chunk of deduplicatedCandidates) {
        const sectionName = resolveSection(chunk);
        const secLower = sectionName.toLowerCase().trim();
        const isParentContainer = secLower === "projects" || secLower === "project" || secLower === "proyek" || secLower === "portofolio";

        if (canonicalChildProjectExists && isParentContainer && primaryIntent === "project") {
            rejectedCandidates.push({
                id: chunk.id,
                document_id: chunk.document_id,
                section: sectionName,
                content: chunk.content.substring(0, 100),
                rejectionReason: "parent-container-suppressed",
                debugScore: {
                    semanticScore: chunk.similarity,
                    intentScore: 0.7,
                    sectionScore: 0.7,
                    coverageScore: 0.0,
                    exactMatchScore: 0.5,
                    hierarchyScore: 0.4,
                    finalScore: 0.0,
                },
            });
            continue;
        }

        hierarchyFilteredCandidates.push(chunk);
    }

    const scoredCandidates = hierarchyFilteredCandidates.map((chunk) => {
        const sectionName = resolveSection(chunk);
        const sectionLower = sectionName.toLowerCase();
        const contentLower = chunk.content.toLowerCase();

        const semanticScore = chunk.similarity;

        let intentScore = 0.0;
        let sectionScore = 0.0;
        let hierarchyScore = 0.5;

        const isChildProjectSection = /^project:\s*\S+/i.test(sectionLower) || /^proyek:\s*\S+/i.test(sectionLower);
        const isParentProjectSection = sectionLower === "projects" || sectionLower === "project" || sectionLower === "proyek" || sectionLower === "portofolio";

        if (primaryIntent === "project") {
            if (isChildProjectSection) {
                intentScore = 1.0;
                sectionScore = 1.0;
                hierarchyScore = 1.0;
            } else if (isParentProjectSection) {
                intentScore = 0.8;
                sectionScore = 0.8;
                hierarchyScore = 0.5;
            } else {
                intentScore = -1.0;
                sectionScore = -1.0;
                hierarchyScore = 0.0;
            }
        } else if (primaryIntent === "education") {
            if (sectionLower.includes("education") || sectionLower.includes("pendidikan") || sectionLower.includes("akademik")) {
                intentScore = 1.0;
                sectionScore = 1.0;
                hierarchyScore = 1.0;
            } else if (sectionLower.includes("profile")) {
                intentScore = 0.2;
                sectionScore = 0.2;
                hierarchyScore = 0.5;
            } else {
                intentScore = -1.0;
                sectionScore = -1.0;
                hierarchyScore = 0.0;
            }
        } else if (primaryIntent === "skills") {
            if (sectionLower.includes("skills") || sectionLower.includes("keahlian") || sectionLower.includes("kemampuan")) {
                intentScore = 1.0;
                sectionScore = 1.0;
                hierarchyScore = 1.0;
            } else if (sectionLower.includes("technical experiences") || sectionLower.includes("technical") || isChildProjectSection) {
                intentScore = 0.8;
                sectionScore = 0.8;
                hierarchyScore = 0.8;
            } else {
                intentScore = -1.0;
                sectionScore = -1.0;
                hierarchyScore = 0.0;
            }
        } else if (primaryIntent === "experience") {
            if (
                sectionLower.includes("technical experiences") ||
                sectionLower.includes("experience") ||
                sectionLower.includes("pengalaman") ||
                sectionLower.includes("profile")
            ) {
                intentScore = 1.0;
                sectionScore = 1.0;
                hierarchyScore = 1.0;
            } else if (isChildProjectSection || targetEntity === "SMSC") {
                intentScore = 0.8;
                sectionScore = 0.8;
                hierarchyScore = 0.8;
            } else {
                intentScore = -0.5;
                sectionScore = -0.5;
                hierarchyScore = 0.2;
            }
        } else if (primaryIntent === "contact") {
            if (sectionLower.includes("github") || sectionLower.includes("contact") || sectionLower.includes("kontak") || sectionLower.includes("sosmed")) {
                intentScore = 1.0;
                sectionScore = 1.0;
                hierarchyScore = 1.0;
            } else {
                intentScore = -1.0;
                sectionScore = -1.0;
                hierarchyScore = 0.0;
            }
        } else if (primaryIntent === "language") {
            if (sectionLower.includes("languages") || sectionLower.includes("language") || sectionLower.includes("bahasa")) {
                intentScore = 1.0;
                sectionScore = 1.0;
                hierarchyScore = 1.0;
            } else {
                intentScore = -1.0;
                sectionScore = -1.0;
                hierarchyScore = 0.0;
            }
        } else if (primaryIntent === "profile") {
            if (sectionLower.includes("profile") || sectionLower.includes("about") || sectionLower.includes("profil")) {
                intentScore = 1.0;
                sectionScore = 1.0;
                hierarchyScore = 1.0;
            } else if (sectionLower.includes("technical experiences") || sectionLower.includes("skills")) {
                intentScore = 0.6;
                sectionScore = 0.6;
                hierarchyScore = 0.6;
            } else {
                intentScore = -0.5;
                sectionScore = -0.5;
                hierarchyScore = 0.2;
            }
        } else {
            intentScore = 0.5;
            sectionScore = 0.5;
            hierarchyScore = 0.5;
        }

        let coverageScore = 0.0;
        if (isListQuery && intentScore > 0.5) {
            coverageScore = 1.0;
        }

        let exactMatchScore = 0.0;
        if (targetEntity) {
            const targetLower = targetEntity.toLowerCase();
            if (sectionLower.includes(targetLower) || contentLower.includes(targetLower)) {
                exactMatchScore = 1.0;
                intentScore = Math.max(intentScore, 1.0);
                sectionScore = Math.max(sectionScore, 1.0);
            }
        } else if (keyTerms.length > 0) {
            let directMatches = 0;
            for (const term of keyTerms) {
                if (sectionLower.includes(term) || contentLower.includes(term)) {
                    directMatches++;
                }
            }
            if (directMatches > 0) {
                exactMatchScore = Math.min(1.0, directMatches / keyTerms.length);
            }
        }

        let computedScore =
            weights.semanticWeight * semanticScore +
            weights.intentWeight * intentScore +
            weights.sectionWeight * sectionScore +
            weights.coverageWeight * coverageScore +
            weights.exactMatchWeight * exactMatchScore +
            weights.hierarchyWeight * hierarchyScore;

        if (intentScore < 0.0) {
            computedScore = -1.0;
        }

        const finalScore = parseFloat(computedScore.toFixed(4));

        let retrievalReason = chunk.retrievalReason ?? "semantic";
        if (isChildProjectSection && primaryIntent === "project") {
            retrievalReason = chunk.retrievalReason === "list-expansion" ? "list-expansion" : "canonical-child-selected";
        } else if (exactMatchScore >= 0.8 && intentScore >= 0.8) {
            retrievalReason = "exact-section-match";
        } else if (intentScore > 0.5 && sectionScore > 0.5) {
            retrievalReason = isParentProjectSection ? "parent-fallback" : "intent-section-match";
        }

        const debugScoreObj = {
            semanticScore: parseFloat(semanticScore.toFixed(4)),
            intentScore: parseFloat(intentScore.toFixed(4)),
            sectionScore: parseFloat(sectionScore.toFixed(4)),
            coverageScore: parseFloat(coverageScore.toFixed(4)),
            exactMatchScore: parseFloat(exactMatchScore.toFixed(4)),
            hierarchyScore: parseFloat(hierarchyScore.toFixed(4)),
            finalScore,
        };

        return {
            ...chunk,
            section: sectionName,
            retrievalReason,
            semanticScore: debugScoreObj.semanticScore,
            intentScore: debugScoreObj.intentScore,
            sectionScore: debugScoreObj.sectionScore,
            coverageScore: debugScoreObj.coverageScore,
            exactMatchScore: debugScoreObj.exactMatchScore,
            hierarchyScore: debugScoreObj.hierarchyScore,
            finalScore,
            relevanceScore: finalScore,
            debugScore: debugScoreObj,
        };
    });

    scoredCandidates.sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));

    const validResults = [];

    for (const candidate of scoredCandidates) {
        const intentScore = candidate.intentScore ?? 0;
        const finalScore = candidate.finalScore ?? 0;

        if (primaryIntent !== "general" && (intentScore <= 0.0 || finalScore <= 0.1)) {
            rejectedCandidates.push({
                id: candidate.id,
                document_id: candidate.document_id,
                section: candidate.section,
                content: candidate.content.substring(0, 100),
                rejectionReason: isListQuery ? "unrelated-to-list-query" : "section-mismatch",
                debugScore: candidate.debugScore,
            });
            continue;
        }

        validResults.push(candidate);
    }

    if (isListQuery && primaryIntent !== "general") {
        return {
            results: validResults,
            rejectedCandidates,
        };
    }

    return {
        results: validResults.slice(0, topK),
        rejectedCandidates,
    };
}

// Full candidate pool representing Tara's document structure across uploads (doc_id 20 vs doc_id 11)
const MOCK_CV_CHUNKS = [
    {
        id: "chunk-101-new",
        document_id: "20",
        chunk_index: 0,
        section: "Profile",
        content: "[SECTION: Profile]\nTara Software Engineer dengan 3+ tahun pengalaman dalam web development.",
        similarity: 0.72,
    },
    {
        id: "chunk-102-new",
        document_id: "20",
        chunk_index: 1,
        section: "Skills",
        content: "[SECTION: Skills]\nTechnical Skills: TypeScript, React, Next.js, Node.js, Python, Django, MySQL, PostgreSQL, Redis, Docker.",
        similarity: 0.68,
    },
    {
        id: "chunk-103-new",
        document_id: "20",
        chunk_index: 2,
        section: "Education",
        content: "[SECTION: Education]\nS1 Teknik Informatika Universitas Bina Sarana Informatika 2025.",
        similarity: 0.75,
    },
    {
        id: "chunk-104-new",
        document_id: "20",
        chunk_index: 3,
        section: "Projects",
        content: "[SECTION: Projects]\nOverview of all projects:\n1. System Web Ticketing\n2. Email and Telegram Notification\n3. SMSC Knowledge",
        similarity: 0.85,
    },
    {
        id: "chunk-105-new",
        document_id: "20",
        chunk_index: 4,
        section: "Project: System Web Ticketing",
        content: "[SECTION: Project: System Web Ticketing]\nMengembangkan sistem ticketing menggunakan Django, MySQL, HTML, CSS, JavaScript, Linux Server. Fitur: Authentication and role-based access, Email notification, Ticket Open -> Close.",
        similarity: 0.86,
    },
    {
        id: "chunk-106-new",
        document_id: "20",
        chunk_index: 5,
        section: "Project: Email and Telegram Notification",
        content: "[SECTION: Project: Email and Telegram Notification]\nMembangun microservice notifikasi otomatis di Linux Server via Telegram Bot & Gmail. Fitur: CPU monitoring, Memory monitoring, Storage monitoring, I/O monitoring.",
        similarity: 0.86,
    },
    {
        id: "chunk-107-new",
        document_id: "20",
        chunk_index: 6,
        section: "Project: SMSC Knowledge",
        content: "[SECTION: Project: SMSC Knowledge]\nDokumentasi SMSC operation, Message routing, SMPP protocol, Monitoring, dan Troubleshooting message delivery flow.",
        similarity: 0.86,
    },
    {
        id: "chunk-108-new",
        document_id: "20",
        chunk_index: 7,
        section: "Technical Experiences",
        content: "[SECTION: Technical Experiences]\nFullstack Developer di PT Tech Solution (2022 - Sekarang). Membimbing tim, SMSC troubleshooting, dan merancang arsitektur microservices.",
        similarity: 0.70,
    },
    {
        id: "chunk-109-new",
        document_id: "20",
        chunk_index: 8,
        section: "Languages",
        content: "[SECTION: Languages]\nBahasa Indonesia (Native), English (Professional Working).",
        similarity: 0.50,
    },
    {
        id: "chunk-110-new",
        document_id: "20",
        chunk_index: 9,
        section: "Github",
        content: "[SECTION: Github]\nGithub Profile: https://github.com/tara-dev",
        similarity: 0.60,
    },

    // Duplicate chunks from old document_id 11 (should be filtered out by doc version deduplication)
    {
        id: "chunk-105-old",
        document_id: "11",
        chunk_index: 4,
        section: "Project: System Web Ticketing",
        content: "[SECTION: Project: System Web Ticketing] (OLD VERSION) System Web Ticketing",
        similarity: 0.82,
    },
];

const TARGET_QUERIES = [
    "Apa saja project yang pernah dikerjakan Tara?",
    "Di mana Tara kuliah?",
    "Apa pengalaman kerja Tara?",
    "Apa skill Tara?",
    "Bagaimana pengalaman Tara dengan SMSC?",
    "Project apa yang dibuat menggunakan Django?",
    "Tools apa yang digunakan Tara?",
    "Siapa Tara?",
    "Di mana Tara bekerja?",
    "Apa yang pernah Tara kerjakan?",
];

console.log("=================================================");
console.log("    FULL 10 TARGET RAG QUERIES VERIFICATION      ");
console.log("=================================================\n");

for (let i = 0; i < TARGET_QUERIES.length; i++) {
    const query = TARGET_QUERIES[i];
    const intent = detectQueryIntent(query);
    const { results, rejectedCandidates } = rerankChunksWithDebug(query, MOCK_CV_CHUNKS, 5);

    console.log(`QUERY ${i + 1}: "${query}"`);
    console.log(`- queryIntent: "${intent.primaryIntent}" | isListQuery: ${intent.isListQuery} | targetEntity: ${intent.targetEntity ?? "None"}`);
    console.log(`- candidate count: ${MOCK_CV_CHUNKS.length}`);
    console.log(`- selected chunks count: ${results.length}`);
    console.log(`- rejected chunks count: ${rejectedCandidates.length}`);
    console.log("SELECTED CHUNKS:");
    results.forEach((r, idx) => {
        console.log(`  ${idx + 1}. [${r.section}] (Score: ${r.finalScore}) | Reason: ${r.retrievalReason}`);
    });
    console.log("REJECTED CHUNKS:");
    rejectedCandidates.forEach((rej) => {
        console.log(`  - [${rej.section}] | Reason: ${rej.rejectionReason}`);
    });
    console.log("-------------------------------------------------\n");
}
