export interface ChunkOptions {
    chunkSize?: number;
    overlap?: number;
    minChunkSize?: number;
}

export interface DocumentChunk {
    section: string;
    content: string;
}

interface InternalSection {
    title: string;
    content: string;
}

const SECTION_REGEX =
    /\[SECTION:\s*([^\]]+)\]\s*([\s\S]*?)(?=\[SECTION:|\s*$)/gi;

function splitSections(text: string): InternalSection[] {
    const sections: InternalSection[] = [];

    for (const match of text.matchAll(SECTION_REGEX)) {
        const title = match[1]?.trim();
        const content = match[2]?.trim();

        if (title && content) {
            sections.push({
                title,
                content,
            });
        }
    }

    // Fallback if text does not contain [SECTION: ...] headers
    if (sections.length === 0 && text.trim()) {
        sections.push({
            title: "General",
            content: text.trim(),
        });
    }

    return sections;
}

function splitTextIntoUnits(text: string): string[] {
    // 1. Try splitting by double newline (paragraphs)
    const paragraphs = text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

    if (paragraphs.length > 1) {
        return paragraphs;
    }

    // 2. Try splitting by single newline (lines/bullet points)
    const lines = text
        .split(/\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    if (lines.length > 1) {
        return lines;
    }

    // 3. Fallback: split by sentences (. ! ?)
    const sentences = text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    return sentences.length > 0 ? sentences : [text];
}

function chunkSectionContent(
    sectionTitle: string,
    content: string,
    chunkSize: number,
    overlap: number
): DocumentChunk[] {
    const cleanContent = content.trim();

    if (!cleanContent) {
        return [];
    }

    const formattedContent = cleanContent.startsWith("[SECTION:")
        ? cleanContent
        : `[SECTION: ${sectionTitle}]\n${cleanContent}`;

    // If entire section fits in one chunk, return it intact (guarantees zero section bleeding)
    if (formattedContent.length <= chunkSize) {
        return [
            {
                section: sectionTitle,
                content: formattedContent,
            },
        ];
    }

    const units = splitTextIntoUnits(cleanContent);
    const chunks: string[] = [];

    let currentUnits: string[] = [];
    let currentLength = 0;

    for (const unit of units) {
        // If a single unit is longer than chunkSize, slice it safely
        if (unit.length > chunkSize) {
            if (currentUnits.length > 0) {
                chunks.push(currentUnits.join("\n\n"));
                currentUnits = [];
                currentLength = 0;
            }

            let start = 0;
            while (start < unit.length) {
                const end = Math.min(start + chunkSize, unit.length);
                const sliced = unit.slice(start, end).trim();
                if (sliced) {
                    chunks.push(sliced);
                }
                if (end >= unit.length) break;
                start = end - overlap;
            }

            continue;
        }

        const separatorLength = currentUnits.length > 0 ? 2 : 0;
        if (currentLength + separatorLength + unit.length > chunkSize) {
            if (currentUnits.length > 0) {
                chunks.push(currentUnits.join("\n\n"));
            }

            // Calculate intra-section overlap
            const overlapUnits: string[] = [];
            let overlapLength = 0;

            for (let i = currentUnits.length - 1; i >= 0; i--) {
                const prev = currentUnits[i];
                const sep = overlapUnits.length > 0 ? 2 : 0;
                if (overlapLength + sep + prev.length > overlap) {
                    break;
                }
                overlapUnits.unshift(prev);
                overlapLength += sep + prev.length;
            }

            currentUnits = [...overlapUnits, unit];
            currentLength = currentUnits.reduce((acc, u, idx) => acc + (idx > 0 ? 2 : 0) + u.length, 0);
        } else {
            currentUnits.push(unit);
            currentLength += (currentUnits.length > 1 ? 2 : 0) + unit.length;
        }
    }

    if (currentUnits.length > 0) {
        chunks.push(currentUnits.join("\n\n"));
    }

    // Deduplicate and filter
    const uniqueChunks = Array.from(new Set(chunks))
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

    return uniqueChunks.map((chunkContent) => ({
        section: sectionTitle,
        content: chunkContent.startsWith("[SECTION:") ? chunkContent : `[SECTION: ${sectionTitle}]\n${chunkContent}`,
    }));
}

export function chunkText(
    text: string,
    options: ChunkOptions = {}
): DocumentChunk[] {
    if (!text || typeof text !== "string" || !text.trim()) {
        return [];
    }

    const chunkSize = options.chunkSize ?? 1200;
    const overlap = options.overlap ?? 150;

    if (chunkSize <= 0) {
        throw new Error("chunkSize must be greater than 0");
    }

    if (overlap < 0) {
        throw new Error("overlap cannot be negative");
    }

    if (overlap >= chunkSize) {
        throw new Error("overlap must be smaller than chunkSize");
    }

    const sections = splitSections(text);
    const result: DocumentChunk[] = [];

    for (const section of sections) {
        const sectionChunks = chunkSectionContent(
            section.title,
            section.content,
            chunkSize,
            overlap
        );

        result.push(...sectionChunks);
    }

    return result;
}