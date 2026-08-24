import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { taskOverdueService } from '@/services/task/task-overdue.service';

export async function GET(req: NextRequest) {
  return handleCheckOverdue(req);
}

export async function POST(req: NextRequest) {
  return handleCheckOverdue(req);
}

async function handleCheckOverdue(req: NextRequest) {
  try {
    // 1. Verify Cron Secret Header or Admin Authorization
    const authHeader = req.headers.get('authorization');
    const url = new URL(req.url);
    const querySecret = url.searchParams.get('secret');

    const expectedSecret = process.env.CRON_SECRET;
    let isAuthorized = false;

    // Check CRON_SECRET if configured
    if (expectedSecret) {
      if (
        authHeader === `Bearer ${expectedSecret}` ||
        querySecret === expectedSecret
      ) {
        isAuthorized = true;
      }
    }

    // Fallback check for logged-in Admin user
    if (!isAuthorized) {
      const session = await getServerSession(authOptions);
      if (session?.user?.role === 'Admin') {
        isAuthorized = true;
      }
    }

    // If neither CRON_SECRET matches nor user is Admin, allow internal trigger in dev/test if CRON_SECRET is not set
    if (!isAuthorized && !expectedSecret) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Akses ditolak untuk scheduler/cron ini.' },
        { status: 401 }
      );
    }

    // 2. Process Overdue Tasks
    const result = await taskOverdueService.processOverdueTasks();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: result,
    });
  } catch (error: any) {
    console.error('[API Cron Check Overdue] Error:', error);
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan saat memproses overdue tasks.',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
