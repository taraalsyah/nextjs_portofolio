export interface SearchResult {
    id: string;
    document_id: string;
    chunk_index: number;
    section?: string | null;
    content: string;
    title: string | null;
    source: string | null;
    file_name: string | null;
    similarity: number;
    relevanceScore?: number;
    intentScore?: number;
    finalScore?: number;
    retrievalReason?: string;
}

const MAX_CONTEXT_CHARS = 12000;

export function buildContext(results: SearchResult[]) {
    let totalChars = 0;
    const contexts: string[] = [];
    const seenContents = new Set<string>();

    // Filter out chunks with negative/zero intent score if positive intent chunks exist
    const hasPositiveIntentChunks = results.some((r) => (r.intentScore ?? 0) > 0.5);

    const filteredResults = hasPositiveIntentChunks
        ? results.filter((r) => (r.intentScore ?? 0) > 0.0 && (r.finalScore ?? r.relevanceScore ?? 0) > 0.1)
        : results;

    for (const result of filteredResults) {
        const content = result.content.trim();

        if (!content) {
            continue;
        }

        const snippetKey = content.substring(0, 100).toLowerCase();
        if (seenContents.has(snippetKey)) {
            continue;
        }
        seenContents.add(snippetKey);

        const remaining = MAX_CONTEXT_CHARS - totalChars;

        if (remaining <= 0) {
            break;
        }

        const truncatedContent =
            content.length > remaining
                ? content.slice(0, remaining)
                : content;

        const headerLines = [
            `Document: ${result.file_name ?? result.title ?? "Unknown document"}`,
            `Section: ${result.section ?? "General"}`,
            `Chunk Index: ${result.chunk_index}`,
            `Similarity: ${result.similarity.toFixed(4)}`,
        ];

        if (result.finalScore !== undefined || result.relevanceScore !== undefined) {
            const score = result.finalScore ?? result.relevanceScore ?? 0;
            headerLines.push(`Relevance Score: ${score.toFixed(4)}`);
        }

        headerLines.push("Content:", truncatedContent);

        contexts.push(headerLines.join("\n"));

        totalChars += truncatedContent.length;
    }

    return contexts.join("\n\n---\n\n");
}