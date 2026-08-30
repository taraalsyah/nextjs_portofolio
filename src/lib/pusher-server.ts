import Pusher from 'pusher';

/**
 * Server-side Pusher singleton instance.
 * IMPORTANT: This file MUST NOT be imported in Client Components.
 * Secrets remain strictly server-side.
 */
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
  useTLS: true,
});

export default pusherServer;
