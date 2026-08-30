import PusherClient from 'pusher-js';

let pusherClientInstance: PusherClient | null = null;

/**
 * Client-side Pusher singleton utility.
 * Connects to Pusher using public credentials and authenticates private channels via /api/pusher/auth.
 */
export function getPusherClient(): PusherClient {
  if (typeof window === 'undefined') {
    throw new Error('getPusherClient should only be called on the client side.');
  }

  if (!pusherClientInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1';

    pusherClientInstance = new PusherClient(key, {
      cluster,
      forceTLS: true,
      authEndpoint: '/api/pusher/auth',
    });
  }

  return pusherClientInstance;
}

export default getPusherClient;
