import { NextResponse } from 'next/server';
import { verifyApiPermission } from '@/lib/apiHelper';
import { otpService } from '@/services/otp/otp.service';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  // 1. Otorisasi Admin di backend
  const auth = await verifyApiPermission(request, 'User Management', 'Update');
  if (!auth.authorized) return auth.response!;

  try {
    const params = await props.params;
    const targetUserId = parseInt(params.id, 10);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ message: 'ID User tidak valid.' }, { status: 400 });
    }

    // 2. Buka blokir user secara atomik via otpService
    const result = await otpService.adminUnblockUser(
      auth.userId!,
      targetUserId,
      { ipAddress: auth.ipAddress, userAgent: auth.userAgent }
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/users/[id]/unblock Error:', error);
    const status = error.status || 500;
    const message = error.message || 'Terjadi kesalahan pada server.';
    return NextResponse.json({ message }, { status });
  }
}
