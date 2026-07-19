import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const handler = NextAuth(authOptions);

export async function GET(request: Request, context: any) {
  const response = await handler(request, context);
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  newResponse.headers.set('Pragma', 'no-cache');
  newResponse.headers.set('Expires', '0');
  return newResponse;
}

export async function POST(request: Request, context: any) {
  return handler(request, context);
}
