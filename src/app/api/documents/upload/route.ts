import { extractPdfText } from "@/services/document/pdf.service";
import { chunkText } from "@/services/document/chunk.service";
import { createEmbedding } from "@/services/embedding/voyage.service";
import {
    createDocument,
    createDocumentChunk,
} from "@/services/vector/vector.service";

import { cleanExtractedText } from "@/services/document/text-cleaner.service";
import { addSectionBoundaries } from "@/services/document/section.service";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const file = formData.get("file");

        if (!(file instanceof File)) {
            return Response.json(
                {
                    success: false,
                    error: "PDF file is required",
                },
                { status: 400 }
            );
        }

        if (file.type !== "application/pdf") {
            return Response.json(
                {
                    success: false,
                    error: "Only PDF files are allowed",
                },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(
            await file.arrayBuffer()
        );

        // 1. Extract PDF text
        const rawText = await extractPdfText(buffer);
        const cleanedText = cleanExtractedText(rawText);
        const text = addSectionBoundaries(cleanedText);

        // 2. Create document
        const document = await createDocument({
            title: file.name.replace(/\.pdf$/i, ""),
            source: "upload",
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
        });

        // 3. Chunk text (section-aware)
        const chunks = chunkText(text, {
            chunkSize: 1200,
            overlap: 150,
        });

        // 4. Generate embeddings + save
        for (const [index, chunk] of chunks.entries()) {
            const embedding = await createEmbedding(
                chunk.content
            );

            await createDocumentChunk({
                documentId: Number(document.id),
                chunkIndex: index,
                section: chunk.section,
                content: chunk.content,
                embedding,
            });
        }

        return Response.json({
            success: true,
            document: {
                id: document.id,
                title: document.title,
                fileName: document.file_name,
                fileSize: document.file_size,
            },
            chunks: chunks.length,
        });
    } catch (error) {
        console.error(
            "Document upload error:",
            error
        );

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