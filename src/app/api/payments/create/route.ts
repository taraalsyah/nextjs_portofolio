// Force Next.js HMR rebuild for POST /api/payments/create with draft project fields
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
    const { paymentMethod = 'qris', projectName, description, visibility } = body;

    if (!projectName || !projectName.trim()) {
      return NextResponse.json({ error: 'Nama proyek wajib diisi sebelum pembayaran.' }, { status: 400 });
    }

    const payment = await PaymentService.createProjectPayment({
      userId,
      userEmail: session.user.email || '',
      userName: session.user.name || 'User',
      paymentMethod,
      projectName: projectName.trim(),
      description: description?.trim() || null,
      visibility: visibility === 'TEAM' ? 'TEAM' : 'PRIVATE',
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/payments/create error:', err);
    return NextResponse.json({ error: err.message || 'Gagal membuat transaksi pembayaran.' }, { status: 500 });
  }
}
