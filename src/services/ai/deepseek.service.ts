const DEEPSEEK_API_URL =
    "https://api.deepseek.com/chat/completions";

interface DeepSeekResponse {
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
    }>;
}

export async function generateAnswer(
    prompt: string
): Promise<string> {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
        throw new Error(
            "DEEPSEEK_API_KEY is not configured"
        );
    }

    const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a helpful AI assistant.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.2,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `DeepSeek API error (${response.status}): ${errorText}`
        );
    }

    const data =
        (await response.json()) as DeepSeekResponse;

    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
        throw new Error(
            "DeepSeek API returned an empty response"
        );
    }

    return answer;
}