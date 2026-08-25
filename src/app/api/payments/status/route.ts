// Force Next.js HMR rebuild for GET /api/payments/status
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PaymentService } from '@/services/payment/payment.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id || '0', 10);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user session.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');

    if (transactionId) {
      const payment = await PaymentService.getPaymentByTransactionId(transactionId, userId);
      if (!payment) {
        return NextResponse.json({ error: 'Transaksi tidak ditemukan.' }, { status: 404 });
      }
      return NextResponse.json({ payment });
    }

    // Check if user has any active unused PAID payment
    const activePaidPayment = await PaymentService.getActiveUnusedPayment(userId);
    return NextResponse.json({ activePaidPayment });
  } catch (err: any) {
    console.error('GET /api/payments/status error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
