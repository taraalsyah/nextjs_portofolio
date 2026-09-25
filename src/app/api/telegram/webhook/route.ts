import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/services/telegram/telegram.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const message = body.message;

    // If update is not a text message or missing chat ID, return 200 OK to prevent Telegram retry loops
    if (!message || typeof message.text !== 'string' || !message.chat?.id) {
      return NextResponse.json({ ok: true, message: 'Non-text update ignored' });
    }

    const chatId = message.chat.id;
    const fromId = message.from?.id;
    const text = message.text;

    // Log message info safely without exposing sensitive tokens
    console.log(
      `[Telegram Webhook] Received message from chatId=${chatId}, fromId=${fromId}: "${text}"`
    );

    // Testing behavior: reply with "Pesan kamu diterima: <text>"
    const replyText = `Pesan kamu diterima: ${text}`;
    const result = await sendTelegramMessage(chatId, replyText);

    if (!result.success) {
      console.error(
        `[Telegram Webhook] Failed to send reply to chatId=${chatId}: ${result.error}`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Telegram Webhook Error]:', error?.message || error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'Telegram Webhook API endpoint is active.',
  });
}
