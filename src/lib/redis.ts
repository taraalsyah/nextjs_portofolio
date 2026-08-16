import Redis, { RedisOptions } from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis | null | undefined };

function createRedisClient(): Redis | null {
  if (typeof window !== 'undefined') {
    return null;
  }
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const options: RedisOptions = {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: true,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > 3) {
        return null;
      }
      return Math.min(times * 200, 1000);
    },
  };

  if (redisUrl.startsWith('rediss://')) {
    try {
      const parsedUrl = new URL(redisUrl);
      options.family = 4;
      options.tls = {
        servername: parsedUrl.hostname,
        rejectUnauthorized: false,
      };
    } catch {
      options.tls = {
        rejectUnauthorized: false,
      };
    }
  }

  const client = new Redis(redisUrl, options);

  client.on('error', (err) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Redis Client Warning]:', err?.message || err);
    }
  });

  return client;
}

export const redis = globalForRedis.redis !== undefined ? globalForRedis.redis : createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

/**
 * Safely GET data from Redis. Returns null if key missing or Redis unavailable.
 */
export async function safeRedisGet(key: string): Promise<string | null> {
  if (!redis || typeof window !== 'undefined') {
    return null;
  }
  try {
    return await redis.get(key);
  } catch (err: any) {
    console.error(`[Redis Error] GET key "${key}" failed:`, err?.message || err);
    return null;
  }
}

/**
 * Safely SET data in Redis with optional TTL (seconds). Ignores errors if Redis unavailable.
 */
export async function safeRedisSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (!redis || typeof window !== 'undefined') {
    return;
  }
  try {
    if (ttlSeconds && ttlSeconds > 0) {
      await redis.set(key, value, 'EX', ttlSeconds);
    } else {
      await redis.set(key, value);
    }
  } catch (err: any) {
    console.error(`[Redis Error] SET key "${key}" failed:`, err?.message || err);
  }
}

/**
 * Safely DEL key from Redis. Ignores errors if Redis unavailable.
 */
export async function safeRedisDel(key: string): Promise<void> {
  if (!redis || typeof window !== 'undefined') {
    return;
  }
  try {
    await redis.del(key);
  } catch (err: any) {
    console.error(`[Redis Error] DEL key "${key}" failed:`, err?.message || err);
  }
}

export default redis;
