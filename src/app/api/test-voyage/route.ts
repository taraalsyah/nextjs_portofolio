import { createEmbedding } from "@/services/embedding/voyage.service";

export async function GET() {
    try {
        const text = "Ini adalah teks untuk testing embedding Voyage.";

        const embedding = await createEmbedding(text);

        return Response.json({
            success: true,
            dimensions: embedding.length,
            preview: embedding.slice(0, 5),
        });
    } catch (error) {
        console.error("Voyage embedding error:", error);

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