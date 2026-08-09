export interface RagSource {
  documentId: number;
  title?: string;
  fileName?: string;
  source?: string;
  chunkId: number;
  chunkIndex: number;
  section: string;
  similarity: number;
  relevanceScore?: number;
  retrievalReason?: string;
}

export interface ChatApiResponse {
  success: boolean;
  answer?: string;
  source?: RagSource | null;
  sources?: RagSource[];
  error?: string;
}

export interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: RagSource | null;
  sources?: RagSource[];
  createdAt: string;
  isError?: boolean;
}

/**
 * Client service to call the RAG Chat API endpoint (/api/chat)
 */
export async function sendChatMessage(
  message: string,
  options?: {
    documentId?: number;
    documentIds?: number[];
    signal?: AbortSignal;
  }
): Promise<ChatApiResponse> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        documentId: options?.documentId,
        documentIds: options?.documentIds,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error ||
        `HTTP Error (${response.status}): Tidak dapat memproses permintaan AI.`;

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data: ChatApiResponse = await response.json();
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Permintaan dibatalkan.',
      };
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Tidak dapat terhubung ke AI service. Silakan periksa koneksi Anda dan coba lagi.',
    };
  }
}
