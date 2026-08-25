import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/services/payment/payment.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const result = await PaymentService.processWebhook(payload, headers);

    if (!result.success) {
      console.error('[Payment Webhook Error]:', result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message }, { status: 200 });
  } catch (err: any) {
    console.error('POST /api/payments/webhook error:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}
