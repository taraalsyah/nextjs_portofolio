import { NextRequest, NextResponse } from 'next/server';
import { taskOverdueService } from '@/services/task/task-overdue.service';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    // Validate Authorization Header strictly: Bearer YOUR_CRON_SECRET
    if (!expectedSecret || !authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Process Overdue Tasks
    const result = await taskOverdueService.processOverdueTasks();

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[API Cron Check Overdue] Error:', error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}

// HTTP Method restrictions: Return 405 Method Not Allowed for non-POST requests
export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
