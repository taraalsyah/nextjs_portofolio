import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserNotifications, markNotificationsAsRead, UserNotificationItem } from '@/services/notification/notification.service';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt((session.user as any).id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid user session' }, { status: 400 });
  }

  const notifications = await getUserNotifications(userId);
  const unreadCount = notifications.filter((n: UserNotificationItem) => !n.isRead).length;

  return NextResponse.json({
    notifications,
    unreadCount,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt((session.user as any).id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid user session' }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { id, markAll } = body;

    if (markAll) {
      await markNotificationsAsRead(userId);
    } else if (id) {
      const parsedId = parseInt(String(id), 10);
      if (!isNaN(parsedId)) {
        await markNotificationsAsRead(userId, parsedId);
      }
    }

    const updatedList = await getUserNotifications(userId);
    const unreadCount = updatedList.filter((n: UserNotificationItem) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications: updatedList,
      unreadCount,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
