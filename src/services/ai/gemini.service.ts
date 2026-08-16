export async function generateAnswerWithGemini(
    prompt: string
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is not configured");
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const response = await fetch(
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

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
        throw new Error("Gemini API returned an empty response");
    }

    return answer;
}
