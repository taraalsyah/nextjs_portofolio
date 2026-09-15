import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runTaskAiAssistant } from "@/services/ai/mcp-gemini.service";
import { SAFE_AI_ERROR_MESSAGE } from "@/services/mcp/error-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // 1. Mandatory server-side authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Silakan login terlebih dahulu untuk mengakses AI Assistant.",
        },
        { status: 401 }
      );
    }

    const userId = parseInt(String((session.user as any).id), 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: User ID session tidak valid.",
        },
        { status: 401 }
      );
    }

    // 2. Parse request payload
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: Request body harus berupa JSON yang valid.",
        },
        { status: 400 }
      );
    }

    const message = body?.message;
    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: Parameter 'message' wajib diisi.",
        },
        { status: 400 }
      );
    }

    const history = Array.isArray(body?.history) ? body.history : [];

    // 3. Process AI query with server-side authorized MCP tools
    const result = await runTaskAiAssistant({
      message: message.trim(),
      userId,
      history,
    });

    return NextResponse.json({
      success: true,
      answer: result.answer,
      toolCallsUsed: result.toolCallsUsed,
    });
  } catch (error: any) {
    console.error("[AI_CHAT_ROUTE_ERROR] Raw Exception:", {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });

    return NextResponse.json(
      {
        success: false,
        answer: SAFE_AI_ERROR_MESSAGE,
        error: SAFE_AI_ERROR_MESSAGE,
      },
      { status: 500 }
    );
  }
}
