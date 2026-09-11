export async function generateAnswerWithGemini(
    prompt: string
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is not configured");
    }

    const candidateModels = Array.from(
        new Set([
            ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
            "gemini-3.5-flash-lite",
            "gemini-2.5-flash-lite",
            "gemini-1.5-flash-8b",
            "gemini-1.5-flash",
            "gemini-2.0-flash",
            "gemini-2.5-flash",
        ])
    );

    let response: Response | null = null;
    let errorText = "";

    for (const model of candidateModels) {
        response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.2,
                    },
                }),
            }
        );

        if ((response.status === 404 || response.status === 503 || response.status === 429) && candidateModels.indexOf(model) < candidateModels.length - 1) {
            continue;
        }

        if (!response.ok) {
            errorText = await response.text();
            throw new Error(`Gemini API error (${response.status}): ${errorText}`);
        }

        break;
    }

    if (!response || !response.ok) {
        throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
        throw new Error("Gemini API returned an empty response");
    }

    return answer;
}
