import { NextRequest, NextResponse } from "next/server";
import { MCP_TOOLS_LIST, handleDirectToolCall } from "@/services/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Verify MCP Authentication via MCP_API_KEY environment variable.
 * Supports:
 * - Authorization: Bearer <key>
 * - x-mcp-api-key: <key>
 * - Query parameter: ?apiKey=<key> or ?token=<key>
 */
function verifyMcpAuth(request: Request): NextResponse | null {
  const mcpApiKey = process.env.MCP_API_KEY;

  // If MCP_API_KEY is not configured in environment, allow access (or log warning in dev)
  if (!mcpApiKey || mcpApiKey.trim() === "") {
    return null;
  }

  const url = new URL(request.url);
  const queryKey = url.searchParams.get("apiKey") || url.searchParams.get("token");
  const headerKey = request.headers.get("x-mcp-api-key");
  const authHeader = request.headers.get("authorization");

  let bearerToken: string | null = null;
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    bearerToken = authHeader.substring(7).trim();
  }

  const providedKey = queryKey || headerKey || bearerToken;

  if (!providedKey || providedKey !== mcpApiKey) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Unauthorized: Invalid or missing MCP API key",
        },
      },
      { status: 401 }
    );
  }

  return null;
}

/**
 * GET /api/mcp
 * Streamable HTTP SSE endpoint for MCP clients
 */
export async function GET(request: Request) {
  const authError = verifyMcpAuth(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const sessionId = crypto.randomUUID();

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // 1. Emit the standard MCP SSE "endpoint" event informing the client where to POST messages
  const endpointUrl = `${url.pathname}?sessionId=${sessionId}`;
  const initialEvent = `event: endpoint\ndata: ${endpointUrl}\n\n`;
  writer.write(encoder.encode(initialEvent));

  // 2. Setup periodic SSE keep-alive ping to prevent connection timeout on Vercel/proxies
  const keepAliveInterval = setInterval(() => {
    try {
      writer.write(encoder.encode(": keep-alive\n\n"));
    } catch {
      clearInterval(keepAliveInterval);
    }
  }, 15000);

  // Clean up on abort
  request.signal.addEventListener("abort", () => {
    clearInterval(keepAliveInterval);
    try {
      writer.close();
    } catch {}
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * POST /api/mcp
 * JSON-RPC 2.0 over Streamable HTTP for MCP clients
 */
export async function POST(request: Request) {
  const authError = verifyMcpAuth(request);
  if (authError) return authError;

  let body: any;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32700,
          message: "Parse error: Invalid JSON was received by the server.",
        },
        id: null,
      },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32600,
          message: "Invalid Request: Payload must be a JSON object.",
        },
        id: null,
      },
      { status: 400 }
    );
  }

  const { jsonrpc, method, params, id } = body;

  // Handle JSON-RPC method calls
  try {
    switch (method) {
      case "initialize": {
        return NextResponse.json({
          jsonrpc: "2.0",
          id: id ?? 1,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: "tasktuntas-mcp",
              version: "1.0.0",
            },
          },
        });
      }

      case "notifications/initialized": {
        // Notification, return 200 OK
        return NextResponse.json({
          jsonrpc: "2.0",
          result: {},
        });
      }

      case "ping": {
        return NextResponse.json({
          jsonrpc: "2.0",
          id: id ?? null,
          result: {},
        });
      }

      case "tools/list": {
        return NextResponse.json({
          jsonrpc: "2.0",
          id: id ?? null,
          result: {
            tools: MCP_TOOLS_LIST,
          },
        });
      }

      case "tools/call": {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};

        if (!toolName || typeof toolName !== "string") {
          return NextResponse.json(
            {
              jsonrpc: "2.0",
              error: {
                code: -32602,
                message: "Invalid params: 'name' is required in tools/call.",
              },
              id: id ?? null,
            },
            { status: 400 }
          );
        }

        try {
          const resultText = await handleDirectToolCall(toolName, toolArgs);
          return NextResponse.json({
            jsonrpc: "2.0",
            id: id ?? null,
            result: {
              content: [
                {
                  type: "text",
                  text: resultText,
                },
              ],
            },
          });
        } catch (toolError: any) {
          return NextResponse.json({
            jsonrpc: "2.0",
            id: id ?? null,
            result: {
              isError: true,
              content: [
                {
                  type: "text",
                  text: `Error executing tool '${toolName}': ${
                    toolError?.message || "Unknown error"
                  }`,
                },
              ],
            },
          });
        }
      }

      default: {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            error: {
              code: -32601,
              message: `Method not found: '${method}' is not supported by this MCP server.`,
            },
            id: id ?? null,
          },
          { status: 404 }
        );
      }
    }
  } catch (error: any) {
    console.error("MCP API Route Error:", error);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: error?.message || "Internal server error",
        },
        id: id ?? null,
      },
      { status: 500 }
    );
  }
}
