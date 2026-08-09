import { createEmbedding } from "@/services/embedding/voyage.service";
import {
    searchSimilarChunks,
    rerankChunksWithDebug,
    detectQueryIntent,
    expandChunksBySection,
} from "@/services/vector/vector.service";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const query = body.query;

        if (!query || typeof query !== "string") {
            return Response.json(
                {
                    success: false,
                    error: "query is required",
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

        const embedding = await createEmbedding(query);
        const intentAnalysis = detectQueryIntent(query);

        // Stage 1: Vector similarity search (Top 15 candidates)
        const rawCandidates = await searchSimilarChunks(embedding, 15, 0.20, {
            documentId,
            documentIds,
        });

        // Stage 1.5: Gated Section-Aware Expansion
        let allCandidates = [...rawCandidates];
        const topSimilarity = rawCandidates.length > 0 ? rawCandidates[0].similarity : 0.0;
        if (
            rawCandidates.length > 0 &&
            topSimilarity >= 0.35 &&
            intentAnalysis.primaryIntent !== "general" &&
            !intentAnalysis.isExplicitOutOfScope &&
            intentAnalysis.isListQuery === true
        ) {
            const docIds = Array.from(new Set(rawCandidates.map((c) => Number(c.document_id)).filter(Boolean)));
            const expandedChunks = await expandChunksBySection(docIds, intentAnalysis.primaryIntent, embedding);

            const candidateMap = new Map<string, typeof rawCandidates[0]>();
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

        // Stage 2: Intent & Section Reranking with Configurable Weights, Absolute Threshold & Out-Of-Scope Detection
        const { results, rejectedCandidates, isFallback, low_confidence, isOutOfScope, fallbackWarning } = rerankChunksWithDebug(query, allCandidates, 5);

        return Response.json({
            success: true,
            query,
            queryIntent: intentAnalysis.primaryIntent,
            isListQuery: intentAnalysis.isListQuery,
            isOutOfScope: isOutOfScope ?? false,
            low_confidence: low_confidence ?? false,
            isFallback: isFallback ?? false,
            fallbackWarning: fallbackWarning ?? null,
            stage1_candidates_count: rawCandidates.length,
            expanded_candidates_count: allCandidates.length,
            stage2_reranked_count: results.length,
            rejected_candidates_count: rejectedCandidates.length,
            results: results.map((chunk) => ({
                id: chunk.id,
                document_id: chunk.document_id,
                chunk_index: chunk.chunk_index,
                section: chunk.section,
                content: chunk.content,
                title: chunk.title,
                file_name: chunk.file_name,
                source: chunk.source,
                similarity: chunk.similarity,
                relevanceScore: chunk.relevanceScore,
                retrievalReason: chunk.retrievalReason,
                debugScore: {
                    semanticScore: chunk.semanticScore,
                    intentScore: chunk.intentScore,
                    sectionScore: chunk.sectionScore,
                    coverageScore: chunk.coverageScore,
                    exactMatchScore: chunk.exactMatchScore,
                    hierarchyScore: chunk.hierarchyScore,
                    finalScore: chunk.finalScore,
                    intentGate: chunk.debugScore?.intentGate,
                },
            })),
            rejectedCandidates,
            rawCandidates: rawCandidates.map((chunk) => ({
                id: chunk.id,
                document_id: chunk.document_id,
                chunk_index: chunk.chunk_index,
                section: chunk.section,
                similarity: chunk.similarity,
            })),
        });
    } catch (error) {
        console.error("Vector search error:", error);

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