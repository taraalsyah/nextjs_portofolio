export function cleanExtractedText(
    text: string
): string {
    if (!text || typeof text !== "string") {
        return "";
    }

    let cleaned = text;

    // Normalize line breaks
    cleaned = cleaned
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");

    // Fix common PDF word-splitting problems.
    // Examples:
    // "peme liharaan" -> "pemeliharaan"
    // "M emiliki" -> "Memiliki"
    // "Ja vascript" -> "Javascript"
    //
    // Only merge when the second part starts
    // with a lowercase letter or obvious continuation.
    cleaned = cleaned.replace(
        /([A-Za-z]{2,})\s+([a-z]{2,})/g,
        (match, first, second) => {
            const combined = `${first}${second}`;

            // Avoid merging normal words.
            const commonWords = new Set([
                "IT Support",
                "Web Dev",
            ]);

            if (
                commonWords.has(match)
            ) {
                return match;
            }

            // Don't aggressively merge normal word pairs.
            if (
                first.length > 2 &&
                second.length > 2
            ) {
                return match;
            }

            return combined;
        }
    );

    // Specific PDF extraction artifacts found
    // in this CV.
    const replacements: Array<
        [RegExp, string]
    > = [
            [/\bpeme\s+liharaan\b/gi, "pemeliharaan"],
            [/\bM\s+emiliki\b/g, "Memiliki"],
            [/\bGit\s+L\s+ab\b/gi, "GitLab"],
            [/\bAd\s+vance\b/gi, "Advance"],
            [/\bH\s*TLM\b/gi, "HTML"],
            [/\bJa\s+vascript\b/gi, "Javascript"],
            [/\bb\s+antuan\b/gi, "bantuan"],
            [/\bberbas\s+is\b/gi, "berbasis"],
            [/\bHan\s+dle\b/gi, "Handle"],
            [/\bTi\s+cket\b/gi, "Ticket"],
            [/\bM\s+embuat\b/gi, "Membuat"],
            [/\bE\s+nglish\b/gi, "English"],
            [/\bU\s+niversitas\b/gi, "Universitas"],
            [/\bTekhnik\b/gi, "Teknik"],
            [/\bJa\s+vascript\b/gi, "Javascript"],
            [/\bMYSQL\b/gi, "MySQL"],
        ];

    for (const [pattern, replacement] of replacements) {
        cleaned = cleaned.replace(
            pattern,
            replacement
        );
    }

    // Normalize excessive spaces
    cleaned = cleaned
        .replace(/[ \t]+/g, " ")
        .replace(/\n[ \t]+/g, "\n")
        .trim();

    return cleaned;
}