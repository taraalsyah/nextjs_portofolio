import { NextResponse, NextRequest } from 'next/server';
import { passwordResetService } from '@/lib/password-reset';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token') || '';

    // Validasi token melalui service
    await passwordResetService.validateResetToken(token);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Token valid.' 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Validate Reset Token API Error:', error);

    const status = error.status || 500;
    const message = error.message || 'Terjadi server error.';

    return NextResponse.json(
      { 
        success: false, 
        message 
      },
      { status }
    );
  }
}
