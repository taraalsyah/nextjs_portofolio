import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher-server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt((session.user as any).id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid user session' }, { status: 401 });
  }

  try {
    let socketId = '';
    let channelName = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      socketId = formData.get('socket_id') as string;
      channelName = formData.get('channel_name') as string;
    } else {
      const body = await req.json().catch(() => ({}));
      socketId = body.socket_id;
      channelName = body.channel_name;
    }

    if (!socketId || !channelName) {
      return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 });
    }

    let isAuthorized = false;

    if (channelName.startsWith('private-user-')) {
      const channelUserId = parseInt(channelName.replace('private-user-', ''), 10);
      if (channelUserId === userId) {
        isAuthorized = true;
      }
    } else if (channelName.startsWith('private-project-')) {
      const projectId = parseInt(channelName.replace('private-project-', ''), 10);
      if (!isNaN(projectId)) {
        const member = await prisma.projectMember.findFirst({
          where: {
            projectId,
            userId,
          },
        });
        if (member) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      console.warn(
        `[Pusher Auth Security] User #${userId} attempted unauthorized subscription to channel "${channelName}". Forbidden.`
      );
      return NextResponse.json({ error: 'Forbidden: Access to this channel is denied' }, { status: 403 });
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (err: any) {
    console.error('[Pusher Auth API Error]:', err);
    return NextResponse.json({ error: 'Failed to authorize Pusher channel' }, { status: 500 });
  }
}
