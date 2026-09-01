import { safeRedisGet, safeRedisSet, safeRedisDel } from './redis';

export const CATEGORIES_CACHE_KEY_PREFIX = 'categories:project:';
export const CATEGORIES_LEGACY_CACHE_KEY = 'categories:all';
export const CATEGORIES_CACHE_TTL = 6 * 60 * 60; // 6 hours in seconds

export function getProjectCategoryCacheKey(projectId?: number): string {
  if (projectId && projectId > 0) {
    return `${CATEGORIES_CACHE_KEY_PREFIX}${projectId}`;
  }
  return CATEGORIES_LEGACY_CACHE_KEY;
}

/**
 * Get categories list from Redis read-cache for a specific project.
 */
export async function getCachedCategories(projectId?: number): Promise<any[] | null> {
  const key = getProjectCategoryCacheKey(projectId);
  const cachedData = await safeRedisGet(key);
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
 * Save categories list to Redis read-cache for a specific project.
 */
export async function setCachedCategories(categories: any[], projectId?: number): Promise<void> {
  if (!Array.isArray(categories)) {
    return;
  }
  const key = getProjectCategoryCacheKey(projectId);
  const payload = JSON.stringify(categories);
  await safeRedisSet(key, payload, CATEGORIES_CACHE_TTL);
}

/**
 * Invalidate (delete) categories list from Redis cache for a specific project.
 */
export async function invalidateCategoriesCache(projectId?: number): Promise<void> {
  if (projectId && projectId > 0) {
    await safeRedisDel(getProjectCategoryCacheKey(projectId));
  }
  await safeRedisDel(CATEGORIES_LEGACY_CACHE_KEY);
}
