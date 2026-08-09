import PDFParser from "pdf2json";

export async function extractPdfText(
    file: Buffer
): Promise<string> {
    return new Promise((resolve, reject) => {
        const parser = new PDFParser();

        parser.on("pdfParser_dataError", (errorData) => {
            const err =
                errorData && "parserError" in errorData
                    ? errorData.parserError
                    : errorData;
            reject(err);
        });

        parser.on("pdfParser_dataReady", (pdfData) => {
            try {
                const text = pdfData.Pages.flatMap((page) =>
                    page.Texts.map((text) => {
                        try {
                            return decodeURIComponent(
                                text.R[0].T
                            );
                        } catch {
                            return text.R[0].T;
                        }
                    })
                )
                    .join(" ")
                    .replace(/\s+/g, " ")
                    .trim();

                if (!text) {
                    reject(
                        new Error(
                            "PDF does not contain extractable text"
                        )
                    );
                    return;
                }

                resolve(text);
            } catch (error) {
                reject(error);
            }
        });

        parser.parseBuffer(file);
    });
}