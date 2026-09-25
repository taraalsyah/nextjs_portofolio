export interface TelegramSendMessageResponse {
  ok: boolean;
  result?: any;
  description?: string;
  error_code?: number;
}

export interface SendTelegramMessageResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Sends a text message to a specified Telegram chat using the Telegram Bot API.
 *
 * @param chatId - Telegram chat ID or channel username
 * @param text - Message text to send
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string
): Promise<SendTelegramMessageResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error('[Telegram Service] TELEGRAM_BOT_TOKEN environment variable is missing.');
    return {
      success: false,
      error: 'TELEGRAM_BOT_TOKEN environment variable is not configured.',
    };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });

    const data: TelegramSendMessageResponse = await response.json();

    if (!response.ok || !data.ok) {
      console.error(
        '[Telegram Service] Failed to send Telegram message.',
        `Status: ${response.status}`,
        `Description: ${data.description || 'Unknown Telegram API error'}`
      );
      return {
        success: false,
        error: data.description || `HTTP ${response.status}: Failed to send message`,
      };
    }

    return {
      success: true,
      data: data.result,
    };
  } catch (error: any) {
    console.error(
      '[Telegram Service] Exception caught while sending message:',
      error?.message || error
    );
    return {
      success: false,
      error: 'An internal error occurred while communicating with Telegram API.',
    };
  }
}
