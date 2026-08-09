const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";

interface VoyageEmbeddingResponse {
    data: Array<{
        embedding: number[];
        index: number;
    }>;
    usage: {
        total_tokens: number;
    };
}

export async function createEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.VOYAGE_API_KEY;

    if (!apiKey) {
        throw new Error("VOYAGE_API_KEY is not configured");
    }

    if (!text.trim()) {
        throw new Error("Text cannot be empty");
    }

    const response = await fetch(VOYAGE_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            input: [text],
            model: "voyage-3",
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `Voyage API error (${response.status}): ${errorText}`
        );
    }

    const data =
        (await response.json()) as VoyageEmbeddingResponse;

    if (!data.data?.[0]?.embedding) {
        throw new Error("Voyage API returned an invalid embedding");
    }

    return data.data[0].embedding;
}