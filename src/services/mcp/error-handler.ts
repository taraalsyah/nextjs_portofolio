export const SAFE_AI_ERROR_MESSAGE =
  "Permintaan Anda sedang tidak dapat diproses. Silakan coba beberapa menit lagi.";

export interface StructuredMcpErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Server-side centralized logger and safe error builder.
 * Logs raw error and stack trace to server console,
 * returns a sanitized safe response without technical leakage.
 */
export function handleMcpError(
  error: any,
  contextTag: string = "MCP_TOOL_ERROR"
): string {
  // 1. Server-side detailed logging
  console.error(`[${contextTag}] Raw Error:`, {
    name: error?.name,
    message: error?.message,
    code: error?.code,
    meta: error?.meta,
    stack: error?.stack,
  });

  // 2. Build structured safe error response
  const isValidation = error?.isValidationError || error?.code === "INVALID_INPUT";
  const isForbidden = error?.isForbidden || error?.code === "FORBIDDEN";

  let code = "INTERNAL_ERROR";
  let message = SAFE_AI_ERROR_MESSAGE;

  if (isValidation && typeof error?.message === "string" && error.message.trim() !== "") {
    code = "INVALID_INPUT";
    message = error.message;
  } else if (isForbidden && typeof error?.message === "string" && error.message.trim() !== "") {
    code = "FORBIDDEN";
    message = "Permintaan Anda tidak dapat diproses.";
  }

  const safeResult: StructuredMcpErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };

  return JSON.stringify(safeResult, null, 2);
}
