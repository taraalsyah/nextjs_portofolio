import { createEmbedding } from "@/services/embedding/voyage.service";
import {
    createDocument,
    createDocumentChunk,
} from "@/services/vector/vector.service";

export async function POST() {
    try {
        const content =
            "SIMRS adalah sistem informasi manajemen rumah sakit yang digunakan untuk mengelola data dan proses pelayanan rumah sakit.";

        const embedding = await createEmbedding(content);

        const document = await createDocument({
            title: "Dokumen Test SIMRS",
            source: "test",
        });

        const chunk = await createDocumentChunk({
            documentId: Number(document.id),
            chunkIndex: 0,
            section: "Overview",
            content,
            embedding,
        });

        return Response.json({
            success: true,
            document,
            chunk,
            dimensions: embedding.length,
        });
    } catch (error) {
        console.error("Vector test error:", error);

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