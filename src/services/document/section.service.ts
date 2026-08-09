export interface DocumentSection {
    title: string;
    content: string;
    type?:
        | "profile"
        | "skills"
        | "education"
        | "project"
        | "technical"
        | "languages"
        | "github"
        | "general";
    projectIndex?: number;
}

function normalizeText(text: string): string {
    if (!text) return "";

    return text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\bExperi\s+ences\b/gi, "Experiences")
        .replace(/\bExperi\s+ence\b/gi, "Experience")
        .replace(/\bProjek\b/gi, "Project")
        .replace(/\bTech\s+nical\b/gi, "Technical")
        .replace(/\bEdu\s+cation\b/gi, "Education")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/**
 * Generic project boundary splitter
 * Splits project blocks into individual projects (Project 1, Project 2, Project 3, etc.)
 */
function splitProjects(content: string): DocumentSection[] {
    const cleanContent = content.trim();
    if (!cleanContent) return [];

    // Generic Regex to match project number and title cleanly:
    // Stops before keywords like Tools, Tech, Description, Key, Responsibilities, or next number
    const projectRegex =
        /(?:^|\n|\s*)(?:Project|Proyek)?\s*(\d+)\s*[\.:\)]\s*([A-Za-z0-9\s&\-\/]+?)(?=\s*(?:Tools|Tech|Description|Key|Responsibilities|\d+\s*[\.:\)]|$))/gi;

    const matches = [...cleanContent.matchAll(projectRegex)];

    if (matches.length === 0) {
        return [
            {
                title: "Project",
                type: "project",
                content: cleanContent,
            },
        ];
    }

    const projects: DocumentSection[] = [];

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const projectNumberStr = match[1];
        const projectNumber = parseInt(projectNumberStr, 10);
        let rawTitle = match[2].trim().replace(/[\.:]+$/, "");

        // Clean up project title if PDF text merged description or keywords on the same line
        rawTitle = rawTitle.split(/(?:\s*(?:Tools\s*&\s*Tech|Description|Key\s+Responsibilities|Responsibilities|-|\n))/i)[0].trim();

        const start = (match.index ?? 0) + match[0].length;
        const end =
            i + 1 < matches.length
                ? matches[i + 1].index ?? cleanContent.length
                : cleanContent.length;

        const projectBody = cleanContent.slice(start, end).trim();

        const fullProjectTitle = `Project: ${rawTitle}`;
        const fullContent = `Project ${projectNumber}: ${rawTitle}\n\n${projectBody}`;

        projects.push({
            title: fullProjectTitle,
            type: "project",
            projectIndex: projectNumber,
            content: fullContent,
        });
    }

    return projects;
}

/**
 * Generic & Robust Section Boundary Detection for CV & Structured Documents
 */
export function splitIntoSections(text: string): DocumentSection[] {
    if (!text || typeof text !== "string") {
        return [];
    }

    let normalized = normalizeText(text);

    // 1. Tag Section Boundaries with Generic Patterns
    normalized = normalized.replace(
        /(?:^|\n|\s*)(?:\[TECHNICAL_EXPERIENCES\]|Technical\s+Experi(?:ence|ences)|Work\s+Experience|Pengalaman\s+Kerja|Riwayat\s+Pekerjaan)\s*:/gi,
        "\n\n[BOUNDARY:TECHNICAL_EXPERIENCES]\n"
    );

    normalized = normalized.replace(
        /(?:^|\n|\s*)(?:\[LANGUAGES\]|Languages|Bahasa)\s*:/gi,
        "\n\n[BOUNDARY:LANGUAGES]\n"
    );

    normalized = normalized.replace(
        /(?:^|\n|\s*)(?:\[GITHUB\]|Github|GitHub|Contact|Kontak)\s*:/gi,
        "\n\n[BOUNDARY:GITHUB]\n"
    );

    normalized = normalized.replace(
        /(?:^|\n|\s*)(?:\[EDUCATION\]|Education|Pendidikan|Riwayat\s+Pendidikan|Academic)(?:\s*:|\s+|\n)(?=S1|D3|S2|Universitas|Sekolah|Gelar|Tahun|\d{4})/gi,
        "\n\n[BOUNDARY:EDUCATION]\n"
    );

    // Fallback Education boundary if "S1 Teknik Informatika" appears directly
    normalized = normalized.replace(
        /(?<!\[BOUNDARY:EDUCATION\]\n)\s+(S1\s+Teknik\s+Informatika|S1\s+Informatika|Bachelor\s+of\b)/gi,
        "\n\n[BOUNDARY:EDUCATION]\n$1"
    );

    normalized = normalized.replace(
        /(?:^|\n|\s*)(?:\[PROJECTS\]|Projects|Proyek|Portfolio)(?:\s*:|\s+|\n)(?=(?:Project|Proyek)?\s*1\s*[\.:\)])/gi,
        "\n\n[BOUNDARY:PROJECTS]\n"
    );

    // Fallback Projects boundary if project list starts directly with "1. " or "Project 1:"
    normalized = normalized.replace(
        /(?<!\[BOUNDARY:PROJECTS\]\n)\s+((?:Project|Proyek)?\s*1\s*\.\s*[A-Za-z])/gi,
        "\n\n[BOUNDARY:PROJECTS]\n$1"
    );

    normalized = normalized.replace(
        /(?:^|\n|\s*)(?:\[SKILLS\]|Experiences\s+Skills|Technical\s+Skills|Skills\s*&\s*Abilities|Keahlian|Kemampuan)\b(?:\s*:|\s+|\n)/gi,
        "\n\n[BOUNDARY:SKILLS]\n"
    );

    // 2. Locate all boundary markers
    const boundaryRegex =
        /\[BOUNDARY:(TECHNICAL_EXPERIENCES|LANGUAGES|GITHUB|EDUCATION|PROJECTS|SKILLS)\]/gi;

    const matches = [...normalized.matchAll(boundaryRegex)];

    if (matches.length === 0) {
        return [
            {
                title: "General",
                type: "general",
                content: normalized,
            },
        ];
    }

    const sections: DocumentSection[] = [];

    // 3. Process Profile (Text preceding the first boundary marker)
    const firstBoundaryIndex = matches[0].index ?? normalized.length;
    const profileText = normalized.slice(0, firstBoundaryIndex).trim();

    if (profileText) {
        sections.push({
            title: "Profile",
            type: "profile",
            content: profileText,
        });
    }

    // 4. Process Each Boundary Segment
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const boundaryType = match[1].toUpperCase();

        const start = (match.index ?? 0) + match[0].length;
        const end =
            i + 1 < matches.length
                ? matches[i + 1].index ?? normalized.length
                : normalized.length;

        const segmentContent = normalized.slice(start, end).trim();

        if (!segmentContent) {
            continue;
        }

        if (boundaryType === "PROJECTS") {
            const projectSections = splitProjects(segmentContent);
            sections.push(...projectSections);
            continue;
        }

        const typeMap: Record<
            string,
            { title: string; type: DocumentSection["type"] }
        > = {
            SKILLS: { title: "Skills", type: "skills" },
            EDUCATION: { title: "Education", type: "education" },
            TECHNICAL_EXPERIENCES: {
                title: "Technical Experiences",
                type: "technical",
            },
            LANGUAGES: { title: "Languages", type: "languages" },
            GITHUB: { title: "Github", type: "github" },
        };

        const mapped = typeMap[boundaryType] ?? {
            title: boundaryType,
            type: "general",
        };

        sections.push({
            title: mapped.title,
            type: mapped.type,
            content: segmentContent,
        });
    }

    return sections;
}

export function addSectionBoundaries(text: string): string {
    const sections = splitIntoSections(text);

    if (sections.length === 0) {
        return text;
    }

    return sections
        .map((section) => {
            const cleanBody = section.content.replace(/^\[SECTION:[^\]]+\]\s*/gi, "").trim();
            return `[SECTION: ${section.title}]\n${cleanBody}`;
        })
        .join("\n\n");
}