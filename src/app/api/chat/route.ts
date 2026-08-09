import { createEmbedding } from "@/services/embedding/voyage.service";
import { searchWithLatestPriority, searchAndRerankChunks } from "@/services/vector/vector.service";
import { generateAnswer } from "@/services/ai/deepseek.service";
import { buildContext } from "@/services/vector/context.service";
import { buildRagPrompt } from "@/services/ai/rag-prompt.service";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const message = body.message;

        if (!message || typeof message !== "string") {
            return Response.json(
                {
                    success: false,
                    error: "message is required",
                },
                { status: 400 }
            );
        }

        const documentId =
            typeof body.documentId === "number"
                ? body.documentId
                : undefined;

        const documentIds =
            Array.isArray(body.documentIds)
                ? body.documentIds.filter(
                      (id: unknown): id is number => typeof id === "number"
                  )
                : undefined;

        // 1. Convert question to embedding via Voyage
        const queryEmbedding = await createEmbedding(message);

        // 2. Perform Prioritized Latest File RAG Search
        // If explicit documentId or documentIds are passed, use normal search; otherwise, use searchWithLatestPriority.
        let chunks = [];
        let singleSource = null;
        let isOutOfScope = false;

        if (documentId || documentIds) {
            chunks = await searchAndRerankChunks(message, queryEmbedding, {
                topN: 15,
                topK: 5,
                threshold: 0.20,
                documentId,
                documentIds,
            });
            if (chunks.length > 0) {
                const topChunk = chunks[0];
                singleSource = {
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
            }
        } else {
            const retrievalResult = await searchWithLatestPriority(message, queryEmbedding, {
                topN: 15,
                topK: 5,
                threshold: 0.20,
            });

            chunks = retrievalResult.chunks;
            singleSource = retrievalResult.source;
            isOutOfScope = retrievalResult.isOutOfScope;
        }

        // 3. Fallback when no relevant context is found in latest or old files
        if (chunks.length === 0 || isOutOfScope || !singleSource) {
            return Response.json({
                success: true,
                answer: "Maaf, informasi tersebut tidak ditemukan dalam knowledge base yang tersedia.",
                source: null,
                sources: [],
            });
        }

        // 4. Build concise single-file context using Top K reranked chunks from the single primary source
        const context = buildContext(chunks);

        // 5. Build strict RAG prompt
        const prompt = buildRagPrompt(message, context);

        // 6. Send prompt to DeepSeek
        const answer = await generateAnswer(prompt);

        // 7. Return answer + single primary source contract (and backward-compatible sources array)
        return Response.json({
            success: true,
            answer,
            source: singleSource,
            sources: singleSource ? [singleSource] : [],
        });
    } catch (error) {
        console.error("Chat API error:", error);

        return Response.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error",
            },
            { status: 500 }
        );
    }
}