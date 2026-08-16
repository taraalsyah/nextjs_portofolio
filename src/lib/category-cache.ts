import { safeRedisGet, safeRedisSet, safeRedisDel } from './redis';

export const CATEGORIES_CACHE_KEY = 'categories:all';
export const CATEGORIES_CACHE_TTL = 6 * 60 * 60; // 6 hours in seconds

/**
 * Get categories list from Redis read-cache.
 * Returns parsed category array if HIT, or null if MISS / Redis error.
 */
export async function getCachedCategories(): Promise<any[] | null> {
  const cachedData = await safeRedisGet(CATEGORIES_CACHE_KEY);
  if (!cachedData) {
    return null;
  }
  try {
    const parsed = JSON.parse(cachedData);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return null;
  } catch (err: any) {
    console.error('[Category Cache] Failed to parse cached JSON from Redis:', err?.message || err);
    return null;
  }
}

/**
 * Save categories list to Redis read-cache with 6-hour TTL.
 */
export async function setCachedCategories(categories: any[]): Promise<void> {
  if (!Array.isArray(categories)) {
    return;
  }
  const payload = JSON.stringify(categories);
  await safeRedisSet(CATEGORIES_CACHE_KEY, payload, CATEGORIES_CACHE_TTL);
}

/**
 * Invalidate (delete) categories list from Redis cache.
 * Must be called after successful CREATE, UPDATE, or DELETE in MySQL.
 */
export async function invalidateCategoriesCache(): Promise<void> {
  await safeRedisDel(CATEGORIES_CACHE_KEY);
}
