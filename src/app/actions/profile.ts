'use server';

import { revalidatePath } from 'next/cache';

/**
 * Revalidates the dashboard and profile paths to clear both server-side cache
 * and Next.js client-side in-memory Router Cache.
 */
export async function revalidateDashboard() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profile');
}
