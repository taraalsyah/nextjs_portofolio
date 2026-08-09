import { vectorPool } from "@/lib/vector-db";

export interface CreateDocumentInput {
    title: string;
    source?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    metadata?: Record<string, unknown>;
}

export interface CreateChunkInput {
    documentId: number;
    chunkIndex: number;
    section?: string;
    content: string;
    embedding: number[];
    metadata?: Record<string, unknown>;
}

export interface VectorSearchOptions {
    documentIds?: number[];
    documentId?: number;
    threshold?: number;
    topN?: number; // Stage 1 candidates count (default: 15)
    topK?: number; // Stage 2 final reranked count (default: 5)
    weights?: RerankWeightConfig;
    minRelevanceThreshold?: number; // Absolute score threshold (default: 0.35)
}

export type RetrievalReason =
    | "exact-section-match"
    | "intent-section-match"
    | "list-expansion"
    | "semantic"
    | "parent-fallback"
    | "duplicate-filtered"
    | "canonical-child-selected"
    | "semantic-fallback";

export type RejectionReason =
    | "section-mismatch"
    | "duplicate-doc-version"
    | "duplicate-filtered"
    | "parent-container-suppressed"
    | "low-intent-match"
    | "unrelated-to-list-query"
    | "out-of-scope";

export interface DebugScore {
    semanticScore: number;
    intentScore: number;
    sectionScore: number;
    coverageScore: number;
    exactMatchScore: number;
    hierarchyScore: number;
    finalScore: number;
    intentGate?: number;
}

export interface ChunkSearchResult {
    id: string;
    document_id: string;
    chunk_index: number;
    section: string | null;
    content: string;
    chunk_metadata: Record<string, unknown> | null;
    title: string | null;
    source: string | null;
    file_name: string | null;
    mime_type: string | null;
    similarity: number;
    relevanceScore?: number;
    retrievalReason?: RetrievalReason;

    // Debug Information breakdown
    semanticScore?: number;
    intentScore?: number;
    sectionScore?: number;
    coverageScore?: number;
    exactMatchScore?: number;
    hierarchyScore?: number;
    finalScore?: number;
    debugScore?: DebugScore;
}

export interface RejectedCandidate {
    id: string;
    document_id: string;
    section: string | null;
    content: string;
    rejectionReason: RejectionReason;
    debugScore?: DebugScore;
}

export interface RerankResult {
    results: ChunkSearchResult[];
    rejectedCandidates: RejectedCandidate[];
    isFallback: boolean;
    low_confidence: boolean;
    isOutOfScope: boolean;
    fallbackWarning?: string;
}

export type QueryIntentCategory =
    | "project"
    | "skills"
    | "education"
    | "experience"
    | "contact"
    | "language"
    | "profile"
    | "general";

export interface QueryIntentAnalysis {
    primaryIntent: QueryIntentCategory;
    intentConfidence: number;
    isListQuery: boolean;
    isExplicitOutOfScope: boolean;
    keyTerms: string[];
    targetEntity?: string;
}

export interface RerankWeightConfig {
    semanticWeight: number;
    intentWeight: number;
    sectionWeight: number;
    coverageWeight: number;
    exactMatchWeight: number;
    hierarchyWeight: number;
}

// Configurable Reranking Weights: exactMatchWeight boosted to 0.25 to prioritize exact topical matches over generic sections
export const DEFAULT_RERANK_WEIGHTS: Record<"single" | "list", RerankWeightConfig> = {
    single: {
        semanticWeight: 0.30,
        exactMatchWeight: 0.25, // High priority for explicit entity/topical matches (e.g., SMSC, Django, Education)
        sectionWeight: 0.15,
        intentWeight: 0.15,
        hierarchyWeight: 0.10,
        coverageWeight: 0.05,
    },
    list: {
        semanticWeight: 0.20,
        exactMatchWeight: 0.15,
        sectionWeight: 0.20,
        intentWeight: 0.20,
        coverageWeight: 0.15,
        hierarchyWeight: 0.10,
    },
};

// Continuous Intent Section Affinity Matrix (0.0 to 1.0)
export const SECTION_AFFINITY_MATRIX: Record<QueryIntentCategory, Record<string, number>> = {
    project: {
        "child_project": 1.0,
        "parent_project": 0.80,
        "technical_experiences": 0.40,
        "skills": 0.30,
        "profile": 0.10,
        "default": 0.0,
    },
    experience: {
        "technical_experiences": 1.0,
        "experience": 1.0,
        "work_experience": 1.0,
        "employment": 1.0,
        "profile": 0.85,
        "child_project": 0.30,
        "skills": 0.20,
        "default": 0.0,
    },
    education: {
        "education": 1.0,
        "academic": 1.0,
        "pendidikan": 1.0,
        "profile": 0.25,
        "default": 0.0,
    },
    skills: {
        "skills": 1.0,
        "technical_skills": 1.0,
        "keahlian": 1.0,
        "technical_experiences": 0.50,
        "child_project": 0.50,
        "profile": 0.20,
        "default": 0.0,
    },
    contact: {
        "github": 1.0,
        "contact": 1.0,
        "kontak": 1.0,
        "sosmed": 1.0,
        "profile": 0.30,
        "default": 0.0,
    },
    language: {
        "languages": 1.0,
        "bahasa": 1.0,
        "profile": 0.20,
        "default": 0.0,
    },
    profile: {
        "profile": 1.0,
        "profil": 1.0,
        "about": 1.0,
        "technical_experiences": 0.60,
        "skills": 0.50,
        "default": 0.10,
    },
    general: {
        "default": 0.50,
    },
};

// Explicit Configurable Intent-to-Section Mapping
export const INTENT_SECTION_MAPPING: Record<QueryIntentCategory, string[]> = {
    education: ["Education", "Pendidikan", "Akademik"],
    project: ["Project", "Projects", "Proyek", "Portofolio", "Portfolio", "Task Management Workflow", "Workflow"],
    experience: ["Experience", "Experiences", "Technical Experiences", "Pengalaman", "Profile", "Pekerjaan", "Kerja", "Work Experience", "Employment"],
    skills: ["Skills", "Technical Experiences", "Keahlian", "Kemampuan", "Technical Skills"],
    language: ["Languages", "Bahasa"],
    profile: ["Profile", "About", "Profil"],
    contact: ["Github", "Contact", "Kontak", "Sosmed"],
    general: [],
};

export async function createDocument(input: CreateDocumentInput) {
    const result = await vectorPool.query(
        `
        INSERT INTO documents (
            title,
            source,
            file_name,
            mime_type,
            file_size,
            metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id,
            title,
            source,
            file_name,
            mime_type,
            file_size,
            metadata,
            created_at
        `,
        [
            input.title,
            input.source ?? null,
            input.fileName ?? null,
            input.mimeType ?? null,
            input.fileSize ?? null,
            input.metadata ? JSON.stringify(input.metadata) : null,
        ]
    );

    return result.rows[0];
}

export async function createDocumentChunk(input: CreateChunkInput) {
    const result = await vectorPool.query(
        `
        INSERT INTO document_chunks (
            document_id,
            chunk_index,
            section,
            content,
            embedding,
            metadata
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5::vector,
            $6
        )
        RETURNING
            id,
            document_id,
            chunk_index,
            section,
            content,
            created_at
        `,
        [
            input.documentId,
            input.chunkIndex,
            input.section ?? null,
            input.content,
            `[${input.embedding.join(",")}]`,
            input.metadata ? JSON.stringify(input.metadata) : null,
        ]
    );

    return result.rows[0];
}

/**
 * Stage 1: Vector Similarity Search using pgvector
 * Restricts query to the latest document version per file_name / title at the SQL layer when documentIds are not specified.
 */
export async function searchSimilarChunks(
    embedding: number[],
    limit = 15,
    threshold = 0.20,
    options?: VectorSearchOptions
): Promise<ChunkSearchResult[]> {
    const docIdsFilter = options?.documentIds ?? (options?.documentId ? [options.documentId] : null);

    const result = await vectorPool.query(
        `
        SELECT
            dc.id,
            dc.document_id,
            dc.chunk_index,
            COALESCE(
                NULLIF(TRIM(dc.section), ''),
                (regexp_match(dc.content, '\\[SECTION:\\s*([^\\]]+)\\]', 'i'))[1]
            ) AS section,
            dc.content,
            dc.metadata AS chunk_metadata,

            d.title,
            d.source,
            d.file_name,
            d.mime_type,

            1 - (dc.embedding <=> $1::vector) AS similarity

        FROM document_chunks dc

        INNER JOIN documents d
            ON d.id = dc.document_id

        WHERE 1 - (dc.embedding <=> $1::vector) >= $3
          AND (
              $4::int[] IS NOT NULL AND dc.document_id = ANY($4::int[])
              OR
              $4::int[] IS NULL AND dc.document_id IN (
                  SELECT MAX(id) FROM documents GROUP BY COALESCE(file_name, title)
              )
          )

        ORDER BY dc.embedding <=> $1::vector

        LIMIT $2
        `,
        [
            `[${embedding.join(",")}]`,
            limit,
            threshold,
            docIdsFilter,
        ]
    );

    return result.rows.map((row) => ({
        ...row,
        similarity: parseFloat(row.similarity),
        retrievalReason: "semantic" as RetrievalReason,
    }));
}

/**
 * Stage 1.5: Section-Aware Expansion with Mandatory Actual Cosine Similarity Calculation
 */
export async function expandChunksBySection(
    documentIds: number[],
    primaryIntent: QueryIntentCategory,
    embedding: number[]
): Promise<ChunkSearchResult[]> {
    if (documentIds.length === 0 || primaryIntent === "general" || !Array.isArray(embedding) || embedding.length === 0) {
        return [];
    }

    let sectionPattern = "";
    let contentRegex = "";

    switch (primaryIntent) {
        case "project":
            sectionPattern = "Project%";
            contentRegex = "\\[SECTION:\\s*(Project|Proyek|Portfolio|Portofolio|Task)";
            break;
        case "skills":
            sectionPattern = "%Skill%";
            contentRegex = "\\[SECTION:\\s*(Skills|Technical|Keahlian|Kemampuan)";
            break;
        case "education":
            sectionPattern = "%Education%";
            contentRegex = "\\[SECTION:\\s*(Education|Pendidikan|Akademik)";
            break;
        case "experience":
            sectionPattern = "%Experien%";
            contentRegex = "\\[SECTION:\\s*(Profile|Technical Experiences|Experience|Pengalaman|Work|Employment)";
            break;
        case "contact":
            sectionPattern = "%Github%";
            contentRegex = "\\[SECTION:\\s*(Github|Contact|Kontak)";
            break;
        case "language":
            sectionPattern = "%Language%";
            contentRegex = "\\[SECTION:\\s*(Languages|Bahasa)";
            break;
        case "profile":
            sectionPattern = "%Profile%";
            contentRegex = "\\[SECTION:\\s*(Profile|About|Profil)";
            break;
        default:
            return [];
    }

    const result = await vectorPool.query(
        `
        SELECT
            dc.id,
            dc.document_id,
            dc.chunk_index,
            COALESCE(
                NULLIF(TRIM(dc.section), ''),
                (regexp_match(dc.content, '\\[SECTION:\\s*([^\\]]+)\\]', 'i'))[1]
            ) AS section,
            dc.content,
            dc.metadata AS chunk_metadata,

            d.title,
            d.source,
            d.file_name,
            d.mime_type,

            1 - (dc.embedding <=> $4::vector) AS similarity

        FROM document_chunks dc

        INNER JOIN documents d
            ON d.id = dc.document_id

        WHERE dc.document_id = ANY($1::int[])
          AND (
              dc.section ILIKE $2
              OR dc.content ~* $3
          )

        ORDER BY dc.embedding <=> $4::vector
        `,
        [documentIds, sectionPattern, contentRegex, `[${embedding.join(",")}]`]
    );

    return result.rows.map((row) => ({
        ...row,
        similarity: parseFloat(row.similarity),
        retrievalReason: "list-expansion" as RetrievalReason,
    }));
}

// Noise words in Indonesian & English
const STOP_WORDS = new Set([
    "apa", "saja", "yang", "di", "ke", "dari", "ini", "itu", "siapa", "dimana",
    "mana", "bagaimana", "mengapa", "adalah", "pada", "untuk", "oleh", "dengan",
    "dan", "atau", "sebagai", "tentang", "ada", "bisa", "sudah", "apakah",
    "tersebut", "dapat", "secara", "serta", "dalam", "hal", "kami", "saya", "tara",
    // Question words — never appear in CV/portfolio content, must not dilute discriminativeKeyTerms
    "berapa", "kapan", "kenapa", "jika",
    "punya", "memiliki", "memuat", "berisi", "terdapat", "adakah",
    "the", "is", "a", "an", "what", "where", "how", "who", "which", "of", "in",
    "on", "for", "with", "and", "or", "by", "to", "at", "about", "show", "me",
    "tell", "give", "list", "all", "get",
    // English question words
    "when", "why", "many", "much",
]);

/**
 * High-frequency DOMAIN terms that appear in nearly every chunk of every document.
 * These must NOT be used alone to determine exactMatchScore because they will
 * uniformly inflate scores for ALL chunks, making exactMatchScore non-discriminative.
 *
 * IMPORTANT: Add to this set whenever you notice a term that appears in the section
 * title or document title of most chunks (e.g., the document is titled
 * "Task Management Workflow", so "task", "management", "workflow" are in every
 * section header and unfairly boost every chunk's exactMatchScore).
 */
const DOMAIN_NOISE_TERMS = new Set([
    // Generic project/document structure terms
    "task", "tasks", "management", "workflow", "project", "projects", "proyek",
    "portofolio", "portfolio", "system", "sistem", "aplikasi", "app",
    // Generic action/state verbs & noise nouns
    "digunakan", "gunakan", "menggunakan", "dipakai", "pakai", "terpakai", "memakai", "used", "using", "use",
    "pengerjaan", "pekerjaan", "proses", "fitur", "fiturnya", "fungsi", "fungsionalitas",
    // Generic document structure words
    "section", "overview", "detail", "information", "info",
]);

// Out-of-scope query regex patterns (topics outside professional CV/portfolio domain)
const OUT_OF_SCOPE_REGEX = /(?:\brendang\b|\bmakanan\b|\bminuman\b|\bmasak\b|\bresep\b|\bbaju\b|\bmobil\b|\bhobi\b|\bzodiak\b|\bramalan\b|\bagama\b|\bcuaca\b|\bweather\b|\bgaji\b|\bpacar\b|\bistri\b|\bsuami\b|warna\s+favorit|favorite\s+color|favorite\s+food)/i;

interface RequiredDimensionPattern {
    name: string;
    queryRegex: RegExp;
    signalRegex: RegExp;
    warningMessage: string;
}

/**
 * Expected Answer Attribute / Dimension Requirements (TRIA Detection)
 * Detects queries that ask for specific entity dimensions (e.g. Duration/Timeline, Salary/Financial)
 * where the document may be topically relevant but informationally absent.
 */
const REQUIRED_DIMENSION_PATTERNS: RequiredDimensionPattern[] = [
    {
        name: "duration",
        queryRegex: /(?:berapa\s+lama|durasi|timeline|waktu\s+pengerjaan|berapa\s+(?:hari|minggu|bulan|tahun)|how\s+long|duration|timeframe)/i,
        signalRegex: /(?:\d+\s*(?:hari|minggu|bulan|tahun|jam|bln|thn)|durasi|timeline|waktu\s+pengerjaan|selesai\s+dalam|memakan\s+waktu|pengerjaan\s+selama)/i,
        warningMessage: "Kueri meminta informasi durasi/waktu pengerjaan yang tidak tercantum dalam dokumen.",
    },
    {
        name: "salary_financial",
        queryRegex: /(?:berapa\s+gaji|gajinya|salary|payroll|penghasilan|upah|bayaran)/i,
        signalRegex: /(?:rp|rupiah|gaji|salary|penghasilan|\d+\s*(?:juta|jt|ribu|rb))/i,
        warningMessage: "Kueri meminta informasi finansial/gaji yang tidak tercantum dalam CV/dokumen.",
    },
    {
        name: "deployment_status",
        queryRegex: /(?:sudah\s+deploy|deployed|production|go-live|dirilis|live\s+di|hosting|hosted)/i,
        signalRegex: /(?:deploy|production|hosting|vercel|aws|domain|live\s+di|dirilis\s+pada)/i,
        warningMessage: "Kueri menanyakan status deployment/production yang tidak tercantum dalam dokumen.",
    },
    {
        name: "pricing_subscription",
        queryRegex: /(?:berapa\s+harga|harga\s+langganan|biaya\s+langganan|subscription|pricing|berapa\s+biaya|gratis\s+atau\s+berbayar|paid\s+or\s+free)/i,
        signalRegex: /(?:rp|rupiah|\$|harga|biaya|langganan|subscription|pricing|gratis|berbayar|per\s+bulan|per\s+tahun)/i,
        warningMessage: "Kueri menanyakan harga/biaya langganan yang tidak tercantum dalam dokumen.",
    },
];

// Domain Synonym Dictionary for Exact Match Scoring
const DOMAIN_SYNONYMS: Record<string, string[]> = {
    "sendiri": ["sepihak"],
    "langsung": ["sepihak"],
    "database": ["basis data"],
    "db": ["basis data", "database"],
    "edit": ["mutasi", "put", "patch", "editable", "perubahan"],
    "locked": ["terkunci", "islocked"],
    "mencoba": ["usaha"],
};

/**
 * Count non-overlapping occurrences of a term in text.
 * Used for TF (term frequency) component of exactMatchScore.
 */
function countOccurrences(text: string, term: string): number {
    let count = 0;
    let idx = 0;
    while ((idx = text.indexOf(term, idx)) !== -1) {
        count++;
        idx += term.length;
    }
    // Morphological stem fallback for Indonesian/English terms (length >= 5)
    // E.g., query term "tujuan" matches content "bertujuan"; "dibangunnya" matches "dibangun"
    if (count === 0 && term.length >= 5) {
        const stem = term.substring(0, 5);
        idx = 0;
        while ((idx = text.indexOf(stem, idx)) !== -1) {
            count++;
            idx += stem.length;
        }
    }
    // Domain synonym fallback
    // E.g., query term "sendiri" or "langsung" matches content "sepihak"
    if (count === 0 && DOMAIN_SYNONYMS[term]) {
        for (const syn of DOMAIN_SYNONYMS[term]) {
            idx = 0;
            while ((idx = text.indexOf(syn, idx)) !== -1) {
                count++;
                idx += syn.length;
            }
        }
    }
    return count;
}

// Multilingual Intent Pattern Registers - Includes 'task', 'management', 'workflow', 'arsitektur' under project!
const INTENT_PATTERNS: Record<QueryIntentCategory, { keywords: string[]; regex: RegExp }> = {
    project: {
        keywords: [
            "project", "projects", "proyek", "proyeknya", "portofolio", "portfolio", "aplikasi", "system", "sistem",
            "task", "tasks", "management", "workflow", "arsitektur", "architecture", "board", "kanban", "work",
            "built", "created", "developed", "request", "done", "close", "approval", "reviewer", "owner", "status",
            "perbedaan", "beda", "bedanya", "locking", "locked"
        ],
        regex: /(?:project|proyek|portfolio|portofolio|aplikasi|sistem|task|tasks|workflow|management|arsitektur|architecture|ticketing|smsc|notification|request|done|close|approval|reviewer|locking|locked|perbedaan|bedanya|show\s+me\s+tara'?s\s+work|(?:dikerjakan|dibuat|mengembangkan|membuat|built|developed)\s+(?:oleh|tara|sistem|aplikasi|project|proyek|web|app))/i,
    },
    skills: {
        keywords: ["skill", "skills", "kemampuan", "keahlian", "teknis", "technical", "teknologi", "technology", "tools", "stack", "programming", "python", "php", "django", "javascript", "react", "nextjs"],
        regex: /(?:skill|skills|keahlian|kemampuan|teknologi|technology|tools|tech\s+stack|programming|bahasa\s+pemrograman)/i,
    },
    education: {
        keywords: ["pendidikan", "education", "kuliah", "sekolah", "universitas", "gelar", "s1", "informatika", "studi", "lulusan", "akademik", "degree", "university", "college"],
        regex: /(?:education|pendidikan|kuliah|sekolah|universitas|academic|gelar|s1|informatika|graduated)/i,
    },
    experience: {
        keywords: ["pengalaman", "experience", "pekerjaan", "kerja", "karir", "career", "posisi", "role", "helpdesk", "support", "perusahaan", "riwayat", "employment", "professional", "job", "worked"],
        regex: /(?:pengalaman|experience|pekerjaan|kerja|karir|career|posisi|role|employment|professional\s+experience|riwayat\s+kerja|di\s+mana\s+tara\s+bekerja|where\s+did\s+tara\s+work)/i,
    },
    contact: {
        keywords: ["github", "kontak", "contact", "email", "telepon", "phone", "sosmed", "link", "git", "social"],
        regex: /(?:github|kontak|contact|email|telepon|phone|sosmed|git\s+repository)/i,
    },
    language: {
        keywords: ["bahasa", "language", "languages", "english", "indonesia", "indonesian", "spoken"],
        regex: /(?:language|languages|bahasa|english|indonesian)/i,
    },
    profile: {
        keywords: ["profil", "profile", "tentang", "biodata", "siapa", "who", "about", "bio", "summary"],
        regex: /(?:profil|profile|tentang|biodata|siapa|who\s+is\s+tara|about\s+tara|summary)/i,
    },
    general: {
        keywords: [],
        regex: /^$/,
    },
};

const LIST_QUERY_PATTERNS = [
    /(?:apa\s+saja|apa\s+aja|sebutkan|daftar|list|berikan|tampilkan|semua|proyek\s+apa|project\s+apa|skill\s+apa|apa\s+kemampuan)/i,
    /(?:list\s+all|show\s+me|tell\s+me\s+about|what\s+are|what\s+projects|all\s+projects|all\s+skills)/i,
    /(?:saja|apa-apa|apa\s+yang\s+pernah)/i,
];

/**
 * Multilingual Intent Detection
 */
export function detectQueryIntent(query: string): QueryIntentAnalysis {
    const qLower = query.toLowerCase().trim();

    // Explicit Out-of-Scope Check (regex for non-portfolio domain keywords)
    const isExplicitOutOfScope = OUT_OF_SCOPE_REGEX.test(qLower);

    const isListQuery = LIST_QUERY_PATTERNS.some((pattern) => pattern.test(qLower));

    const tokens = qLower.replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean);
    const keyTerms = Array.from(new Set(tokens.filter((t) => t.length > 2 && !STOP_WORDS.has(t))));

    let maxConfidence = 0.0;
    let bestIntent: QueryIntentCategory = "general";

    for (const [intent, config] of Object.entries(INTENT_PATTERNS) as [QueryIntentCategory, typeof INTENT_PATTERNS[QueryIntentCategory]][]) {
        if (intent === "general") continue;

        let confidence = 0.0;

        if (config.regex.test(qLower)) {
            confidence += 0.60;
        }

        let keywordMatches = 0;
        for (const term of keyTerms) {
            if (
                config.keywords.some(
                    (kw) =>
                        kw === term ||
                        (kw.length >= 4 && term.length >= 4 && (kw.startsWith(term) || term.startsWith(kw)))
                )
            ) {
                keywordMatches++;
            }
        }
        if (keyTerms.length > 0) {
            confidence += 0.40 * Math.min(1.0, keywordMatches / Math.max(1, keyTerms.length));
        }

        if (confidence > maxConfidence) {
            maxConfidence = confidence;
            bestIntent = intent;
        }
    }

    let targetEntity: string | undefined;
    if (qLower.includes("task management") || qLower.includes("workflow")) {
        targetEntity = "Task Management Workflow";
    } else if (qLower.includes("django")) {
        targetEntity = "Django";
    } else if (qLower.includes("smsc")) {
        targetEntity = "SMSC";
    } else if (qLower.includes("tools") || qLower.includes("teknologi") || qLower.includes("tech stack")) {
        targetEntity = "Tools";
    } else if (qLower.includes("system web ticketing") || qLower.includes("ticketing")) {
        targetEntity = "System Web Ticketing";
    } else if (qLower.includes("email and telegram") || qLower.includes("notification")) {
        targetEntity = "Email and Telegram Notification";
    }

    return {
        primaryIntent: isExplicitOutOfScope ? "general" : bestIntent,
        intentConfidence: parseFloat(Math.min(1.0, maxConfidence).toFixed(4)),
        isListQuery,
        isExplicitOutOfScope,
        keyTerms,
        targetEntity,
    };
}

export function resolveSection(chunk: ChunkSearchResult): string {
    if (chunk.section && chunk.section.trim()) {
        return chunk.section.trim();
    }
    const match = /\[SECTION:\s*([^\]]+)\]/i.exec(chunk.content);
    if (match && match[1]) {
        return match[1].trim();
    }
    return "General";
}

/**
 * Calculate Graduated Section Affinity (0.0 to 1.0)
 */
function getSectionAffinity(primaryIntent: QueryIntentCategory, sectionName: string): number {
    const matrix = SECTION_AFFINITY_MATRIX[primaryIntent] ?? SECTION_AFFINITY_MATRIX.general;
    const secLower = sectionName.toLowerCase().trim();

    if (/^project:\s*\S+/i.test(secLower) || /^proyek:\s*\S+/i.test(secLower) || secLower.includes("task management")) {
        return matrix["child_project"] ?? matrix["default"] ?? 0.80;
    }
    if (secLower === "projects" || secLower === "project" || secLower === "proyek" || secLower === "portofolio") {
        return matrix["parent_project"] ?? matrix["default"] ?? 0.0;
    }
    if (secLower.includes("technical experiences") || secLower.includes("technical experience")) {
        return matrix["technical_experiences"] ?? matrix["default"] ?? 0.0;
    }

    for (const [key, score] of Object.entries(matrix)) {
        if (key !== "default" && secLower.includes(key)) {
            return score;
        }
    }

    return matrix["default"] ?? 0.50;
}

/**
 * Stage 2: Intent & Section-Aware Reranking with Soft Hierarchy Penalty (No Hard Suppression)
 */
export function rerankChunksWithDebug(
    query: string,
    candidates: ChunkSearchResult[],
    topK = 5,
    customWeights?: RerankWeightConfig
): RerankResult {
    if (candidates.length === 0) {
        return {
            results: [],
            rejectedCandidates: [],
            isFallback: false,
            low_confidence: false,
            isOutOfScope: false,
        };
    }

    const qLower = query.toLowerCase().trim();
    const intentAnalysis = detectQueryIntent(query);
    const { primaryIntent, intentConfidence, isListQuery, isExplicitOutOfScope, keyTerms, targetEntity } = intentAnalysis;

    const weights = customWeights ?? (isListQuery ? DEFAULT_RERANK_WEIGHTS.list : DEFAULT_RERANK_WEIGHTS.single);
    const rejectedCandidates: RejectedCandidate[] = [];

    // 1. Group candidates to deduplicate across document versions (different document_ids for the SAME document identity & section name).
    // IMPORTANT: Multiple chunks within the SAME document (same document_id) or chunks from DIFFERENT documents
    // (e.g. Doc 21 "Task Management Workflow" vs Doc 23 "Portfolio Knowledge Base") represent distinct content
    // and must NEVER be deduplicated against each other.
    const docSectionToMaxDocIdMap = new Map<string, number>();
    for (const chunk of candidates) {
        const sectionName = resolveSection(chunk);
        const sectionKey = sectionName.toLowerCase().trim();
        const docIdentity = (chunk.title || chunk.file_name || "").toLowerCase().trim();
        const dedupKey = docIdentity ? `${docIdentity}::${sectionKey}` : `doc_${chunk.document_id}::${sectionKey}`;
        const docId = Number(chunk.document_id) || 0;
        const existingDocId = docSectionToMaxDocIdMap.get(dedupKey) ?? 0;
        if (docId > existingDocId) {
            docSectionToMaxDocIdMap.set(dedupKey, docId);
        }
    }

    const deduplicatedCandidates: ChunkSearchResult[] = [];
    for (const chunk of candidates) {
        const sectionName = resolveSection(chunk);
        const sectionKey = sectionName.toLowerCase().trim();
        const docIdentity = (chunk.title || chunk.file_name || "").toLowerCase().trim();
        const dedupKey = docIdentity ? `${docIdentity}::${sectionKey}` : `doc_${chunk.document_id}::${sectionKey}`;
        const docId = Number(chunk.document_id) || 0;
        const highestDocId = docSectionToMaxDocIdMap.get(dedupKey) ?? docId;

        // Reject only if this chunk belongs to an older version of the EXACT SAME document & section
        if (docId < highestDocId) {
            rejectedCandidates.push({
                id: chunk.id,
                document_id: chunk.document_id,
                section: sectionName,
                content: chunk.content.substring(0, 100),
                rejectionReason: "duplicate-doc-version",
            });
        } else {
            deduplicatedCandidates.push(chunk);
        }
    }

    const canonicalChildProjectExists = deduplicatedCandidates.some((chunk) => {
        const sec = resolveSection(chunk).toLowerCase();
        return /^project:\s*\S+/i.test(sec) || /^proyek:\s*\S+/i.test(sec);
    });

    // PRE-SCORING FILTER: Minimum substantive content guard.
    //
    // PURPOSE: Reject PDF parsing artifacts — chunks whose content is so short they
    // carry no informational value (e.g., "Project 0: 20", a mis-tagged page number).
    //
    // THRESHOLD IS CONTEXT-DEPENDENT:
    //
    // • List queries (isListQuery = true):
    //   Threshold = 15 words. In list results, artifact chunks with section labels like
    //   "Project: 20" get isChildProjectSection = true → hierarchyScore = 1.0 → they
    //   rank near the top regardless of content. A stricter threshold is necessary.
    //
    // • Single-answer / factual queries (isListQuery = false):
    //   Threshold = 4 words. Short but valid factual answers must NOT be rejected —
    //   e.g., "S1 Teknik Informatika Universitas Bina Sarana Informatika 2025" (~8 words)
    //   is the correct answer to "Di mana Tara kuliah?" and must pass through.
    //   Only catch truly empty / whitespace-only chunks.
    //
    // IMPORTANT: This filter runs before scoring. Rejected chunks get flat-zero debugScore.
    // Do NOT raise the single-answer threshold above ~6 without re-testing Education, SMSC,
    // and other short factual section queries first.
    const MIN_WORDS_LIST_QUERY   = 15;  // strict: catches artifact project label chunks
    const MIN_WORDS_SINGLE_QUERY =  4;  // permissive: only catches truly empty chunks
    const minWordThreshold = isListQuery ? MIN_WORDS_LIST_QUERY : MIN_WORDS_SINGLE_QUERY;

    const substantiveDeduplicatedCandidates: ChunkSearchResult[] = [];
    for (const chunk of deduplicatedCandidates) {
        const strippedContent = chunk.content
            .replace(/\[[^\]]+\]/g, " ")   // strip [SECTION: ...] markers
            .replace(/[^\w\s]/g, " ")       // strip punctuation
            .trim();
        const wordCount = strippedContent.split(/\s+/).filter((w) => w.length > 0).length;

        if (wordCount < minWordThreshold) {
            rejectedCandidates.push({
                id: chunk.id,
                document_id: chunk.document_id,
                section: resolveSection(chunk),
                content: chunk.content.substring(0, 100),
                rejectionReason: "section-mismatch",
                debugScore: {
                    semanticScore: chunk.similarity,
                    intentScore: 0,
                    sectionScore: 0,
                    coverageScore: 0,
                    exactMatchScore: 0,
                    hierarchyScore: 0,
                    finalScore: 0,
                    intentGate: 0,
                },
            });
            continue;
        }

        substantiveDeduplicatedCandidates.push(chunk);
    }

    // IDF PRE-COMPUTATION
    // Compute document frequency of each query term across the candidate pool.
    // Runs once in O(T × N) before the scoring map — trivially fast (T≈5 terms, N≈15 chunks).
    // IDF = log((N+1)/(df+1)) + 1  (smoothed, always ≥ 1.0)
    // Terms that appear in many candidates get low IDF (low discriminative power).
    // Terms that appear in few/no candidates get high IDF (highly discriminative).
    const idfCandidateCount = substantiveDeduplicatedCandidates.length;
    const termDocFreq = new Map<string, number>();
    for (const term of keyTerms) {
        let df = 0;
        for (const c of substantiveDeduplicatedCandidates) {
            const combined = `${resolveSection(c)} ${c.content}`.toLowerCase();
            if (combined.includes(term)) df++;
        }
        termDocFreq.set(term, df);
    }
    const getTermIDF = (term: string): number => {
        if (idfCandidateCount === 0) return 1.0;
        const df = termDocFreq.get(term) ?? 0;
        return Math.log((idfCandidateCount + 1) / (df + 1)) + 1.0;
    };

    const scoredCandidates = substantiveDeduplicatedCandidates.map((chunk) => {
        const sectionName = resolveSection(chunk);
        const sectionLower = sectionName.toLowerCase();
        const contentLower = chunk.content.toLowerCase();
        const titleLower = (chunk.title ?? "").toLowerCase();

        const semanticScore = chunk.similarity;
        let sectionAffinity = getSectionAffinity(primaryIntent, sectionName);
        let intentScore = sectionAffinity;

        let exactMatchScore = 0.0;

        // DISCRIMINATIVE KEY TERM MATCHING:
        // Step 1: Separate query-specific discriminative terms from generic domain noise.
        // Generic domain terms (e.g., "task", "management") appear in virtually every
        // chunk's section/title when the document is about task management, making them
        // non-discriminative for exactMatchScore. We only use SPECIFIC terms.
        const discriminativeKeyTerms = keyTerms.filter((t) => !DOMAIN_NOISE_TERMS.has(t));
        const genericDomainTerms = keyTerms.filter((t) => DOMAIN_NOISE_TERMS.has(t));

        // Step 2: Score against discriminative terms FIRST (these are the real query signal).
        // E.g., for "arsitektur yang di gunakan task management?", discriminativeKeyTerms = ["arsitektur"]
        // E.g., for "berapa status di task management?", discriminativeKeyTerms = ["status"]
        //   ("berapa" is now in STOP_WORDS; "task","management" are in DOMAIN_NOISE_TERMS)
        if (discriminativeKeyTerms.length > 0) {
            // TF-IDF weighted exact match scoring:
            // For each discriminative term:
            //   - IDF weight: terms rare across the candidate pool score higher
            //     (e.g., "arsitektur" in 1/15 candidates → IDF≈3.1 vs "status" in 8/15 → IDF≈1.6)
            //   - TF: log-normalized occurrence count in header (1.5x bonus) or body (1.0x base)
            //     (e.g., chunk with 3x "status" scores higher than chunk with 1x "status")
            // Normalized by maximum possible score (all header matches) → range [0.0, 1.0]
            let weightedScore = 0;
            let totalIdfWeight = 0;
            for (const term of discriminativeKeyTerms) {
                const idf = getTermIDF(term);
                totalIdfWeight += idf;

                const headerOcc = countOccurrences(`${sectionLower} ${titleLower}`, term);
                const bodyOcc   = countOccurrences(contentLower, term);

                let termScore = 0;
                if (headerOcc > 0) {
                    // Header match: 1.5 base + log bonus for repeated mentions
                    termScore = (1.5 + 0.3 * Math.min(1.5, Math.log(1 + headerOcc))) * idf;
                } else if (bodyOcc > 0) {
                    // Body match: 1.0 base + log bonus for repeated mentions
                    termScore = (1.0 + 0.3 * Math.min(1.0, Math.log(1 + bodyOcc))) * idf;
                }
                weightedScore += termScore;
            }
            // Normalize: max possible = 1.5 * totalIdfWeight (all header matches, single occurrence)
            const maxPossible = 1.5 * totalIdfWeight;
            exactMatchScore = maxPossible > 0 ? Math.min(1.0, weightedScore / maxPossible) : 0.0;
        }

        // Step 3: If targetEntity is set AND discriminative score is zero, check entity match.
        // This handles cases where the query term IS the entity (e.g., "SMSC", "Django")
        // but does NOT override a valid discriminative term score.
        if (targetEntity && exactMatchScore < 0.50) {
            const targetLower = targetEntity.toLowerCase();
            if (sectionLower.includes(targetLower) || titleLower.includes(targetLower)) {
                // Entity found in section/title but discriminative terms already scored it;
                // only lift if this gives a higher score.
                exactMatchScore = Math.max(exactMatchScore, 0.60);
                intentScore = Math.max(intentScore, 0.85);
                sectionAffinity = Math.max(sectionAffinity, 0.80);
            } else if (contentLower.includes(targetLower)) {
                exactMatchScore = Math.max(exactMatchScore, 0.40);
                intentScore = Math.max(intentScore, 0.70);
                sectionAffinity = Math.max(sectionAffinity, 0.65);
            }
        }

        // Step 4: Fallback — if no discriminative terms exist, use generic domain terms
        // with REDUCED weight (they are not specific to this query).
        if (discriminativeKeyTerms.length === 0 && genericDomainTerms.length > 0 && exactMatchScore === 0.0) {
            let headerMatches = 0;
            let bodyMatches = 0;
            for (const term of genericDomainTerms) {
                if (sectionLower.includes(term) || titleLower.includes(term)) headerMatches++;
                else if (contentLower.includes(term)) bodyMatches++;
            }
            // Generic terms carry reduced weight (max 0.40) to avoid false inflation
            exactMatchScore = Math.min(0.40, 0.40 * Math.min(1.0, (1.5 * headerMatches + 1.0 * bodyMatches) / genericDomainTerms.length));
        }

        if (exactMatchScore >= 0.75) {
            sectionAffinity = Math.max(sectionAffinity, 0.75);
            intentScore = Math.max(intentScore, 0.75);
        } else if (exactMatchScore >= 0.40) {
            sectionAffinity = Math.max(sectionAffinity, 0.60);
            intentScore = Math.max(intentScore, 0.60);
        }

        // STRONG VECTOR / EXACT MATCH OVERRIDE SIGNAL:
        // Structural Principle: When a chunk demonstrates proven content relevance
        // (strong vector similarity >= 0.45 OR dual signals: semanticScore >= 0.35 AND exactMatchScore >= 0.30),
        // its routing signals (intentScore, sectionAffinity) are fully elevated to 1.0 (no artificial discounts).
        // This guarantees the CONTENT SUPREMACY INVARIANT across all retrieval paths.
        if (semanticScore >= 0.45 || (semanticScore >= 0.35 && exactMatchScore >= 0.30) || (semanticScore >= 0.40 && exactMatchScore >= 0.75)) {
            intentScore = Math.max(intentScore, 1.0);
            sectionAffinity = Math.max(sectionAffinity, 1.0);
        } else if (semanticScore >= 0.40 || exactMatchScore >= 0.75) {
            intentScore = Math.max(intentScore, 0.85);
            sectionAffinity = Math.max(sectionAffinity, 0.85);
        }

        // GENERALIZED INTENT SECTION SYNONYM ALIGNMENT
        // Purpose: Reward chunks whose SECTION TYPE structurally matches the query intent
        // (e.g., "Education" section for an education intent query).
        if (primaryIntent !== "general" && primaryIntent !== "project") {
            const mappedSections = INTENT_SECTION_MAPPING[primaryIntent] ?? [];
            const isMatchingDomainSection = mappedSections.some((sec) => sectionLower.includes(sec.toLowerCase()));

            if (isMatchingDomainSection && intentConfidence >= 0.60) {
                // Unconditionally improve routing signals to 1.0
                intentScore = Math.max(intentScore, 1.0);
                sectionAffinity = Math.max(sectionAffinity, 1.0);

                // Conditionally improve exactMatchScore — only when section-type is a reliable
                // content proxy (no specific entity to find, or entity already found).
                const hasSpecificTarget = targetEntity !== undefined;
                const targetAlreadyMatched = hasSpecificTarget && exactMatchScore >= 0.40;

                if (!hasSpecificTarget || targetAlreadyMatched) {
                    exactMatchScore = Math.max(exactMatchScore, 0.85);
                }
            }
        }

        const isArtifactNumberProjectSection = /^project:\s*\d+$/i.test(sectionLower) || /^proyek:\s*\d+$/i.test(sectionLower);
        const isChildProjectSection =
            (/^project:\s*\S+/i.test(sectionLower) || /^proyek:\s*\S+/i.test(sectionLower)) &&
            !isArtifactNumberProjectSection;
        const isParentProjectSection = sectionLower === "projects" || sectionLower === "project" || sectionLower === "proyek" || sectionLower === "portofolio";

        // GRADUATED HIERARCHY SCORE:
        // - Child sections (Project: Foo) → always 1.0
        // - Non-child sections with proven content relevance (dual signals or semantic >= 0.45) → 1.0
        // - Parent containers → dynamic based on proven content relevance
        let hierarchyScore = 0.50;
        if (isChildProjectSection) {
            hierarchyScore = 1.0;
        } else if (isParentProjectSection) {
            if (semanticScore >= 0.45 || (exactMatchScore >= 0.30 && semanticScore >= 0.35) || (exactMatchScore >= 0.75 && semanticScore >= 0.40)) {
                hierarchyScore = 1.0; // Full credit for parent section when content relevance is proven
            } else if (isListQuery && canonicalChildProjectExists) {
                hierarchyScore = 0.40;
            } else {
                hierarchyScore = 0.80;
            }
        } else {
            // Non-project-labeled sections: scale with content evidence
            if (semanticScore >= 0.45 || (exactMatchScore >= 0.30 && semanticScore >= 0.35) || exactMatchScore >= 0.75) {
                hierarchyScore = 1.0; // Full credit for proven content relevance
            } else if (exactMatchScore >= 0.75 || semanticScore >= 0.40) {
                hierarchyScore = 0.85;
            } else {
                hierarchyScore = 0.50;
            }
        }

        const coverageScore = (isListQuery && intentScore > 0.40) ? 1.0 : 0.0;

        // F. SOFT MULTIPLIER INTENT GATING FORMULA
        const intentGate = intentScore < 0.15
            ? parseFloat((0.05 + 0.10 * (Math.max(0, intentScore) / 0.15)).toFixed(4))
            : parseFloat(Math.min(1.0, intentScore).toFixed(4));

        const additiveScore =
            weights.semanticWeight * semanticScore +
            weights.exactMatchWeight * exactMatchScore +
            weights.sectionWeight * sectionAffinity +
            weights.hierarchyWeight * hierarchyScore +
            weights.coverageWeight * coverageScore +
            weights.intentWeight * intentConfidence;

        const finalScore = parseFloat((intentGate * additiveScore).toFixed(4));

        let retrievalReason: RetrievalReason = chunk.retrievalReason ?? "semantic";
        if (isChildProjectSection && primaryIntent === "project") {
            retrievalReason = chunk.retrievalReason === "list-expansion" ? "list-expansion" : "canonical-child-selected";
        } else if (exactMatchScore >= 0.75 && intentScore >= 0.75) {
            retrievalReason = "exact-section-match";
        } else if (intentScore >= 0.50 && sectionAffinity >= 0.50) {
            retrievalReason = isParentProjectSection ? "parent-fallback" : "intent-section-match";
        }

        const debugScoreObj: DebugScore = {
            semanticScore: parseFloat(semanticScore.toFixed(4)),
            intentScore: parseFloat(intentScore.toFixed(4)),
            sectionScore: parseFloat(sectionAffinity.toFixed(4)),
            coverageScore: parseFloat(coverageScore.toFixed(4)),
            exactMatchScore: parseFloat(exactMatchScore.toFixed(4)),
            hierarchyScore: parseFloat(hierarchyScore.toFixed(4)),
            finalScore,
            intentGate,
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

    // CONSOLIDATED CONTENT SUPREMACY INVARIANT ENFORCER
    // Guarantees that if Candidate A is strictly superior to Candidate B in BOTH primary
    // content relevance signals (semanticScore AND exactMatchScore), Candidate A's finalScore
    // will ALWAYS be strictly greater than Candidate B's finalScore across ALL retrieval paths.
    for (let i = 0; i < scoredCandidates.length; i++) {
        for (let j = 0; j < scoredCandidates.length; j++) {
            if (i === j) continue;
            const a = scoredCandidates[i];
            const b = scoredCandidates[j];

            const aSuperior =
                (a.semanticScore ?? 0) > (b.semanticScore ?? 0) &&
                (a.exactMatchScore ?? 0) > (b.exactMatchScore ?? 0);

            if (aSuperior && (a.debugScore?.intentGate ?? 1.0) >= 0.50 && (b.debugScore?.intentGate ?? 1.0) >= 0.50) {
                if ((a.finalScore ?? 0) <= (b.finalScore ?? 0)) {
                    const newFinalScore = parseFloat(((b.finalScore ?? 0) + 0.0100).toFixed(4));
                    a.finalScore = newFinalScore;
                    a.relevanceScore = newFinalScore;
                    if (a.debugScore) a.debugScore.finalScore = newFinalScore;
                }
            }
        }
    }

    // Sort by finalScore; use retrievalReason path priority strictly as a TIE-BREAKER
    scoredCandidates.sort((a, b) => {
        const scoreDiff = (b.finalScore ?? 0) - (a.finalScore ?? 0);
        if (Math.abs(scoreDiff) > 0.0001) {
            return scoreDiff;
        }

        // TIE-BREAKER 1: Retrieval path preference when finalScores are identical
        const getPathPriority = (c: ChunkSearchResult) => {
            if (c.retrievalReason === "canonical-child-selected") return 3;
            if (c.retrievalReason === "exact-section-match") return 2;
            if (c.retrievalReason === "intent-section-match") return 1;
            return 0;
        };
        const pathDiff = getPathPriority(b) - getPathPriority(a);
        if (pathDiff !== 0) return pathDiff;

        // TIE-BREAKER 2: Raw vector similarity
        return (b.similarity ?? 0) - (a.similarity ?? 0);
    });

    // 4. Intent-Aware Trimming with List-Query Section Guard
    const hasHighPriorityIntentChunks = scoredCandidates.some((c) => (c.intentScore ?? 0) >= 0.75);
    const validResults: ChunkSearchResult[] = [];

    for (const candidate of scoredCandidates) {
        const candidateIntentScore = candidate.intentScore ?? 0;
        const candidateFinalScore = candidate.finalScore ?? 0;
        const candidateSection = resolveSection(candidate);

        // Guard 1: Basic intent threshold — always applied
        if (primaryIntent !== "general") {
            if (candidateIntentScore < 0.15 || candidateFinalScore <= 0.005) {
                rejectedCandidates.push({
                    id: candidate.id,
                    document_id: candidate.document_id,
                    section: candidateSection,
                    content: candidate.content.substring(0, 100),
                    rejectionReason: isListQuery ? "unrelated-to-list-query" : "section-mismatch",
                    debugScore: candidate.debugScore,
                });
                continue;
            }

            // Guard 2: List-query section relevance gate.
            // For list queries, a chunk MUST have a genuine structural section affinity > 0
            // for the primary intent BEFORE any content-signal overrides are applied.
            // rawSectionAffinity captures getSectionAffinity() output before the override
            // pipeline runs. If it is 0.0, the section is structurally off-topic for this
            // intent (e.g., Github/Contact for project queries). Even if the semantic or
            // exact-match override later boosted intentScore to a passing value (0.75),
            // a list query must not surface genuinely off-domain sections.
            if (isListQuery) {
                // rawSectionAffinity is stored on the candidate via the debugScore sectionScore
                // field which, at scoring time, reflects the FINAL post-override sectionAffinity.
                // We need the PRE-OVERRIDE value, which we stored separately and attached here.
                // Since candidate is a scored result object, we check its pre-override value
                // that was stored in the debugScore. However, debugScore.sectionScore reflects
                // post-override state. The cleanest approach: re-evaluate getSectionAffinity
                // using the resolved section name (fast, no DB, pure computation).
                const preOverrideAffinity = getSectionAffinity(primaryIntent, candidateSection);
                if (preOverrideAffinity === 0.0) {
                    rejectedCandidates.push({
                        id: candidate.id,
                        document_id: candidate.document_id,
                        section: candidateSection,
                        content: candidate.content.substring(0, 100),
                        rejectionReason: "unrelated-to-list-query",
                        debugScore: candidate.debugScore,
                    });
                    continue;
                }
            }

            // Guard 3: Relative intent threshold — when high-priority intent chunks exist,
            // reject anything that scored significantly below them.
            if (hasHighPriorityIntentChunks && candidateIntentScore < 0.40) {
                rejectedCandidates.push({
                    id: candidate.id,
                    document_id: candidate.document_id,
                    section: candidateSection,
                    content: candidate.content.substring(0, 100),
                    rejectionReason: "section-mismatch",
                    debugScore: candidate.debugScore,
                });
                continue;
            }
        }

        validResults.push(candidate);
    }

    const topScore = scoredCandidates.length > 0 ? (scoredCandidates[0].finalScore ?? 0) : 0.0;
    const topSemanticScore = scoredCandidates.length > 0 ? (scoredCandidates[0].semanticScore ?? 0) : 0.0;
    const topExactMatchScore = scoredCandidates.length > 0 ? (scoredCandidates[0].exactMatchScore ?? 0) : 0.0;
    const hasStrongVectorOrExactMatch = topSemanticScore >= 0.40 || topExactMatchScore >= 0.75;
    const hasStrongDomainMatch = validResults.some((r) => (r.intentScore ?? 0) >= 0.75 && (r.finalScore ?? 0) >= 0.30);

    // DYNAMIC STAGE 2 OUT-OF-SCOPE EVALUATION
    let isOutOfScope = isExplicitOutOfScope;
    if (!isExplicitOutOfScope && primaryIntent === "general" && !hasStrongVectorOrExactMatch && keyTerms.length > 0) {
        isOutOfScope = true;
    }

    // GENERALIZED TRIA (Topically Relevant, Informationally Absent) EVALUATION
    // Filter check pool to ONLY inspect the Top-K valid results of the primary document being answered.
    // If the top candidates belong to a dominant document_id (e.g. Document 21: Task Management Workflow),
    // signal verification MUST NOT leakage-check unrelated documents (e.g. Document 20: CV Ticketing System).
    const topValidCandidates = validResults.slice(0, Math.min(topK, 5));
    const primaryDocId = topValidCandidates.length > 0 ? topValidCandidates[0].document_id : undefined;

    const primaryDocumentCandidates = primaryDocId !== undefined
        ? topValidCandidates.filter((c) => Number(c.document_id) === Number(primaryDocId))
        : topValidCandidates;

    const checkPool = primaryDocumentCandidates.length > 0 ? primaryDocumentCandidates : topValidCandidates;

    // Layer 1: Dimension-pattern check for specific attribute queries (e.g. Duration/Timeline, Salary/Financial, Deployment Status)
    let missingConceptWarning: string | undefined;
    const activeDimension = REQUIRED_DIMENSION_PATTERNS.find((dim) => dim.queryRegex.test(qLower));

    if (activeDimension) {
        const hasDimensionSignal = checkPool.some((c) =>
            activeDimension.signalRegex.test(`${c.section ?? ""} ${c.title ?? ""} ${c.content}`)
        );
        if (!hasDimensionSignal) {
            missingConceptWarning = activeDimension.warningMessage;
        }
    }

    // Layer 2: Generalized discriminative concept verification check for ANY query (including Yes/No status/condition queries)
    // Extract discriminative target terms (non-noise, non-stopword terms).
    // If the user query asks about specific discriminative concepts (e.g. "deployed", "production", "hosting", "harga")
    // but NONE of those concepts (nor their stems/synonyms) appear anywhere in the check pool of the target document,
    // the query is informationally absent in the corpus and must be flagged as low_confidence.
    if (!missingConceptWarning) {
        const discriminativeTerms = keyTerms.filter((t) => !DOMAIN_NOISE_TERMS.has(t));
        if (discriminativeTerms.length > 0 && checkPool.length > 0) {
            let matchedDiscriminativeCount = 0;
            for (const term of discriminativeTerms) {
                const hasMatch = checkPool.some((c) => {
                    const text = `${c.section ?? ""} ${c.title ?? ""} ${c.content}`.toLowerCase();
                    return countOccurrences(text, term) > 0;
                });
                if (hasMatch) {
                    matchedDiscriminativeCount++;
                }
            }

            if (matchedDiscriminativeCount === 0) {
                missingConceptWarning = `Informasi spesifik mengenai '${discriminativeTerms.join(", ")}' tidak ditemukan dalam dokumen.`;
            }
        }
    }

    // 5. DYNAMIC & ADAPTIVE LOW-CONFIDENCE & CONSOLIDATED OUT-OF-SCOPE EVALUATION
    let isLowConfidence = false;
    let fallbackWarning: string | undefined;

    // Evaluate top candidate score and evidence signals
    const topResult = validResults.length > 0 ? validResults[0] : (candidates.length > 0 ? candidates[0] : undefined);
    const topResultScore = topResult?.finalScore ?? topScore;
    const topResultExactMatch = topResult?.exactMatchScore ?? 0;
    const topResultSemantic = topResult?.semanticScore ?? topScore;

    // A result is considered a strong direct match if it has high finalScore (>= 0.35) AND (exactMatchScore >= 0.30 OR semanticScore >= 0.45)
    const hasStrongDirectEvidence = (topResultScore >= 0.35) && (topResultExactMatch >= 0.30 || topResultSemantic >= 0.45);

    // GOLDEN RULE OF TRUTH & TRIA HIERARCHY:
    // 1. Priority 1 (TRIA Warning): If missingConceptWarning is set (Layer 1 Dimension Pattern or Layer 2 Discriminative Concept missing),
    //    the requested information is DEFINITIVELY ABSENT in the document. High scores on generic background terms MUST NOT override it.
    // 2. Priority 2 (Direct Evidence): If no required concept is missing AND reranking found strong direct evidence, set isOutOfScope = false.
    // 3. Priority 3 (Explicit Out-Of-Scope or Low Score): Otherwise, set isOutOfScope = true.
    if (missingConceptWarning) {
        isOutOfScope = true;
        isLowConfidence = true;
        fallbackWarning = missingConceptWarning;
    } else if (hasStrongDirectEvidence) {
        isOutOfScope = false;
    } else if (isExplicitOutOfScope || topResultScore < 0.35) {
        isOutOfScope = true;
        isLowConfidence = true;
        if (isExplicitOutOfScope) {
            fallbackWarning = "Kueri berada di luar cakupan CV/portfolio (out-of-scope). Informasi ini tidak tersedia di CV Tara.";
        } else {
            fallbackWarning = "Informasi spesifik yang ditanyakan tidak ditemukan secara eksplisit dalam dokumen.";
        }
    } else if (validResults.length === 0 && candidates.length > 0) {
        isLowConfidence = true;
        isOutOfScope = true;
        fallbackWarning = "Seluruh kandidat ditolak oleh penyaringan intent ketat; mengembalikan hasil kemiripan vektor terdekat.";
    } else if (primaryIntent === "general" && topScore < 0.20 && !hasStrongVectorOrExactMatch) {
        isLowConfidence = true;
        isOutOfScope = true;
        fallbackWarning = `Kueri umum memiliki skor relevansi (${topScore}) di bawah threshold minimum (0.20).`;
    }

    if (isLowConfidence) {
        const fallbackResults = (validResults.length > 0 ? validResults : candidates)
            .slice()
            .sort((a, b) => (b.finalScore ?? b.similarity) - (a.finalScore ?? a.similarity))
            .slice(0, 2)
            .map((chunk) => ({
                ...chunk,
                retrievalReason: "semantic-fallback" as RetrievalReason,
                relevanceScore: parseFloat((chunk.finalScore ?? chunk.similarity).toFixed(4)),
            }));

        return {
            results: fallbackResults,
            rejectedCandidates,
            isFallback: true,
            low_confidence: true,
            isOutOfScope,
            fallbackWarning,
        };
    }

    return {
        results: isListQuery && primaryIntent !== "general" ? validResults : validResults.slice(0, topK),
        rejectedCandidates,
        isFallback: false,
        low_confidence: false,
        isOutOfScope: false,
    };
}

export function rerankChunks(
    query: string,
    candidates: ChunkSearchResult[],
    topK = 5,
    customWeights?: RerankWeightConfig
): ChunkSearchResult[] {
    const { results } = rerankChunksWithDebug(query, candidates, topK, customWeights);
    return results;
}

/**
 * End-to-End Two-Stage Retrieval with Gated Section Expansion & Fallback Strategy
 */
export async function searchAndRerankChunks(
    query: string,
    embedding: number[],
    options?: VectorSearchOptions
): Promise<ChunkSearchResult[]> {
    const topN = options?.topN ?? 15;
    const topK = options?.topK ?? 5;
    const threshold = options?.threshold ?? 0.20;

    const rawCandidates = await searchSimilarChunks(embedding, topN, threshold, options);

    const intentAnalysis = detectQueryIntent(query);
    const { primaryIntent, intentConfidence, isListQuery, isExplicitOutOfScope } = intentAnalysis;

    let allCandidates = [...rawCandidates];

    // GATED SECTION EXPANSION (Stage 1.5):
    // MUST BE A GENUINE LIST QUERY (isListQuery === true)!
    // Do NOT expand for targeted single-topic queries to prevent pulling unrelated project noise!
    const topSimilarity = rawCandidates.length > 0 ? rawCandidates[0].similarity : 0.0;

    if (
        rawCandidates.length > 0 &&
        topSimilarity >= 0.35 &&
        primaryIntent !== "general" &&
        !isExplicitOutOfScope &&
        isListQuery === true // GATED STRICTLY FOR GENUINE LIST QUERIES ONLY!
    ) {
        const docIds = Array.from(new Set(rawCandidates.map((c) => Number(c.document_id)).filter(Boolean)));
        const expandedChunks = await expandChunksBySection(docIds, primaryIntent, embedding); // Mandatory actual vector cosine similarity calculation!

        const candidateMap = new Map<string, ChunkSearchResult>();
        for (const candidate of rawCandidates) {
            candidateMap.set(candidate.id, candidate);
        }
        for (const expChunk of expandedChunks) {
            if (!candidateMap.has(expChunk.id)) {
                candidateMap.set(expChunk.id, expChunk);
            }
        }
        allCandidates = Array.from(candidateMap.values());
    }

    return rerankChunks(query, allCandidates, options?.topK ?? 5, options?.weights);
}

export interface DocumentRecord {
    id: number;
    title: string;
    fileName: string | null;
    source: string | null;
    createdAt: Date;
}

export interface SingleSource {
    documentId: number;
    title: string;
    fileName: string;
    source?: string;
    chunkId: number;
    chunkIndex: number;
    section: string;
    similarity: number;
    relevanceScore?: number;
    retrievalReason?: string;
}

export interface LatestPrioritySearchResult {
    chunks: ChunkSearchResult[];
    source: SingleSource | null;
    isOutOfScope: boolean;
    low_confidence: boolean;
    warning?: string;
    usedLatestFile: boolean;
}

/**
 * Fetch the latest document uploaded/processed into the database (by created_at & id).
 */
export async function getLatestDocument(): Promise<DocumentRecord | null> {
    const result = await vectorPool.query(
        `SELECT id, title, file_name, source, created_at FROM documents ORDER BY created_at DESC, id DESC LIMIT 1`
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
        id: Number(row.id),
        title: row.title,
        fileName: row.file_name,
        source: row.source,
        createdAt: row.created_at,
    };
}

/**
 * Fetch all document IDs except the specified latest document ID.
 */
export async function getAllDocumentIdsExcept(latestId: number): Promise<number[]> {
    const result = await vectorPool.query(
        `SELECT id FROM documents WHERE id != $1 ORDER BY created_at DESC, id DESC`,
        [latestId]
    );
    return result.rows.map((row) => Number(row.id));
}

/**
 * Prioritized Latest File Retrieval Strategy (Latest File First):
 * 1. Search latest uploaded file FIRST (documentId = latestDoc.id).
 * 2. If latest file yields relevant in-scope results, use ONLY the latest file. Never mix old files.
 * 3. If latest file yields NO relevant results (out of scope / low score), fall back to searching old files.
 * 4. Returns maximum 1 primary source metadata object (source).
 */
export async function searchWithLatestPriority(
    query: string,
    embedding: number[],
    options?: VectorSearchOptions
): Promise<LatestPrioritySearchResult> {
    const latestDoc = await getLatestDocument();

    if (!latestDoc) {
        return {
            chunks: [],
            source: null,
            isOutOfScope: true,
            low_confidence: true,
            warning: "Belum ada dokumen yang diunggah ke knowledge base.",
            usedLatestFile: false,
        };
    }

    // ── STAGE 1: Search & Rerank Latest Uploaded File ONLY ──
    const latestN = options?.topN ?? 15;
    const latestK = options?.topK ?? 5;
    const threshold = options?.threshold ?? 0.20;

    const latestRawCandidates = await searchSimilarChunks(embedding, latestN, threshold, {
        ...options,
        documentId: latestDoc.id,
    });

    const latestRerank = rerankChunksWithDebug(query, latestRawCandidates, latestK, options?.weights);

    const isLatestRelevant =
        !latestRerank.isOutOfScope &&
        !latestRerank.low_confidence &&
        latestRerank.results.length > 0;

    if (isLatestRelevant) {
        const topChunk = latestRerank.results[0];
        const singleSource: SingleSource = {
            documentId: Number(topChunk.document_id),
            title: topChunk.title || topChunk.file_name || `Document #${topChunk.document_id}`,
            fileName: topChunk.file_name || topChunk.title || `Document #${topChunk.document_id}`,
            source: topChunk.source || undefined,
            chunkId: Number(topChunk.id),
            chunkIndex: topChunk.chunk_index,
            section: topChunk.section || "General",
            similarity: topChunk.similarity,
            relevanceScore: topChunk.relevanceScore,
            retrievalReason: topChunk.retrievalReason,
        };

        return {
            chunks: latestRerank.results,
            source: singleSource,
            isOutOfScope: false,
            low_confidence: false,
            warning: undefined,
            usedLatestFile: true,
        };
    }

    // ── STAGE 2: Fallback Search on Older Files (ONLY when Latest File is Irrelevant) ──
    const oldDocIds = await getAllDocumentIdsExcept(latestDoc.id);

    if (oldDocIds.length === 0) {
        return {
            chunks: [],
            source: null,
            isOutOfScope: true,
            low_confidence: true,
            warning: latestRerank.warning || "Maaf, informasi tersebut tidak ditemukan dalam knowledge base yang tersedia.",
            usedLatestFile: false,
        };
    }

    const oldRawCandidates = await searchSimilarChunks(embedding, latestN, threshold, {
        ...options,
        documentIds: oldDocIds,
    });

    const oldRerank = rerankChunksWithDebug(query, oldRawCandidates, latestK, options?.weights);

    const isOldRelevant =
        !oldRerank.isOutOfScope &&
        !oldRerank.low_confidence &&
        oldRerank.results.length > 0;

    if (isOldRelevant) {
        // Find single best old document among the results to prevent mixing multiple old files
        const bestDocId = Number(oldRerank.results[0].document_id);
        const bestOldDocChunks = oldRerank.results.filter(
            (c) => Number(c.document_id) === bestDocId
        );
        const topChunk = bestOldDocChunks[0] || oldRerank.results[0];

        const singleSource: SingleSource = {
            documentId: Number(topChunk.document_id),
            title: topChunk.title || topChunk.file_name || `Document #${topChunk.document_id}`,
            fileName: topChunk.file_name || topChunk.title || `Document #${topChunk.document_id}`,
            source: topChunk.source || undefined,
            chunkId: Number(topChunk.id),
            chunkIndex: topChunk.chunk_index,
            section: topChunk.section || "General",
            similarity: topChunk.similarity,
            relevanceScore: topChunk.relevanceScore,
            retrievalReason: topChunk.retrievalReason,
        };

        return {
            chunks: bestOldDocChunks,
            source: singleSource,
            isOutOfScope: false,
            low_confidence: false,
            warning: undefined,
            usedLatestFile: false,
        };
    }

    // ── STAGE 3: Neither Latest File Nor Old Files have relevant info ──
    return {
        chunks: [],
        source: null,
        isOutOfScope: true,
        low_confidence: true,
        warning: "Maaf, informasi tersebut tidak ditemukan dalam knowledge base yang tersedia.",
        usedLatestFile: false,
    };
}