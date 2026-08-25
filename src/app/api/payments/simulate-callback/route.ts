import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PaymentService } from '@/services/payment/payment.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id || '0', 10);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user session.' }, { status: 401 });
    }

    const body = await req.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'ID Transaksi wajib diisi.' }, { status: 400 });
    }

    const payment = await PaymentService.simulatePaymentSuccess(transactionId, userId);

    return NextResponse.json({ success: true, payment });
  } catch (err: any) {
    console.error('POST /api/payments/simulate-callback error:', err);
    return NextResponse.json({ error: err.message || 'Simulation failed' }, { status: 500 });
  }
}
