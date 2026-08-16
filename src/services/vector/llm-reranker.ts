/**
 * LLM-based stage-2 reranker scaffold.
 *
 * Intended as a drop-in replacement for the TF-IDF exactMatchScore in
 * vector.service.ts when you want truly semantic relevance scoring.
 *
 * Architecture:
 *   Stage 1 (current): vector similarity → candidate pool (top-15)
 *   Stage 2 (this):    LLM cross-encoder → final ranked list (top-3)
 *
 * Model options (in order of cost/accuracy tradeoff):
 *   - Gemini Flash 2.5  (already in your stack, API via REST endpoint)
 *   - OpenAI gpt-4o-mini (cheaper than full gpt-4o, good for reranking)
 *   - Local: BAAI/bge-reranker-base via HuggingFace Inference API (free tier)
 *
 * Usage in vector.service.ts:
 *   const reranked = await llmRerank(query, scoredCandidates.slice(0, 8));
 *   // Replace top N results with LLM-reranked order
 */

import type { ChunkSearchResult } from "@/services/vector/vector.service";

export interface RerankedChunk {
    id: number | string;
    section: string;
    content: string;
    relevanceScore: number;  // 0–1, LLM-assigned
    reasoning: string;       // LLM explanation for debugging
}

/**
 * Rerank a pool of candidate chunks using Gemini Flash REST API as a cross-encoder.
 *
 * @param query         Original user query (natural language)
 * @param candidates    Top-N chunks from stage 1 (vector similarity)
 * @param topK          How many to return (default: 3)
 * @returns             Reranked subset, highest relevance first
 */
export async function llmRerank(
    query: string,
    candidates: ChunkSearchResult[],
    topK: number = 3,
): Promise<RerankedChunk[]> {
    if (candidates.length === 0) return [];
    if (candidates.length <= 1) {
        return [{
            id: candidates[0].id,
            section: candidates[0].section ?? "",
            content: candidates[0].content,
            relevanceScore: 1.0,
            reasoning: "Only candidate — no reranking needed.",
        }];
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        return candidates.slice(0, topK).map((c) => ({
            id: c.id,
            section: c.section ?? "",
            content: c.content,
            relevanceScore: c.similarity,
            reasoning: "API key missing — falling back to vector similarity.",
        }));
    }

    // Build the cross-encoder prompt
    const candidateList = candidates
        .map((c, i) => `[${i}] SECTION: ${c.section ?? "Unknown"}\nCONTENT: ${c.content.slice(0, 400)}`)
        .join("\n\n---\n\n");

    const prompt = `You are a relevance scoring system for a CV/portfolio chatbot.

USER QUERY: "${query}"

Score each candidate below for how well it answers the query.
Return a JSON array where each element has:
  - "index": candidate index (0-based, matching [N] above)
  - "score": float 0.0–1.0 (1.0 = perfectly answers the query)
  - "reason": one sentence explaining the score

Rules:
- Score 0.9–1.0: chunk directly and specifically answers the question
- Score 0.5–0.8: chunk is related but incomplete or generic
- Score 0.0–0.4: chunk is off-topic or does not address the question
- Do NOT consider chunk index as a ranking signal
- Base scores purely on semantic relevance between query and content

CANDIDATES:
${candidateList}

Respond with ONLY valid JSON, no markdown:
[{"index": 0, "score": 0.9, "reason": "..."}, ...]`;

    try {
        const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "[]";

        // Parse JSON response (strip markdown code blocks if present)
        const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        const scores: Array<{ index: number; score: number; reason: string }> = JSON.parse(jsonText);

        // Map back to chunks and sort by score
        const reranked: RerankedChunk[] = scores
            .filter(s => s.index >= 0 && s.index < candidates.length)
            .map(s => ({
                id:             candidates[s.index].id,
                section:        candidates[s.index].section ?? "",
                content:        candidates[s.index].content,
                relevanceScore: Math.min(1.0, Math.max(0.0, s.score)),
                reasoning:      s.reason,
            }))
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, topK);

        return reranked;

    } catch (err) {
        // Graceful degradation: return candidates in their original order
        console.error("[llmRerank] LLM call failed, falling back to stage-1 order:", err);
        return candidates.slice(0, topK).map(c => ({
            id:             c.id,
            section:        c.section ?? "",
            content:        c.content,
            relevanceScore: c.similarity,
            reasoning:      "LLM unavailable — using vector similarity score.",
        }));
    }
}

/**
 * Integration example — drop into the bottom of reranking in vector.service.ts:
 *
 * ```typescript
 * // After building finalRankedResults (current TF-IDF pipeline):
 * const LLM_RERANKING_ENABLED = process.env.ENABLE_LLM_RERANKING === "true";
 * if (LLM_RERANKING_ENABLED && finalRankedResults.length > 1) {
 *     const topCandidatesForLLM = finalRankedResults.slice(0, 8);
 *     const reranked = await llmRerank(query, topCandidatesForLLM, 3);
 *     // Merge: LLM-reranked top-3 + remaining (for fallback coverage)
 *     const rerankedIds = new Set(reranked.map(r => r.id));
 *     finalRankedResults = [
 *         ...topCandidatesForLLM.filter(c => rerankedIds.has(c.id))
 *             .sort((a, b) => {
 *                 const aScore = reranked.find(r => r.id === a.id)!.relevanceScore;
 *                 const bScore = reranked.find(r => r.id === b.id)!.relevanceScore;
 *                 return bScore - aScore;
 *             }),
 *         ...finalRankedResults.filter(c => !rerankedIds.has(c.id)),
 *     ];
 * }
 * ```
 *
 * Cost estimate (Gemini Flash 2.0):
 *   ~800 input tokens + 100 output tokens per query
 *   At free tier: 1,500 RPD / 15 RPM — sufficient for portfolio demo
 *   At paid tier: ~$0.00015 per query — negligible
 */
