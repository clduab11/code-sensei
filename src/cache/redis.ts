import { createClient } from 'redis';
import { config } from '../config';
import { logger } from '../utils/logger';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function initializeRedis() {
  try {
    redisClient = createClient({
      url: config.redis.url,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });

    await redisClient.connect();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Redis initialization failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - app can work without Redis
  }
}

export function getRedis() {
  return redisClient;
}

export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}

/**
 * Cache helper functions
 */
export async function cacheGet(key: string): Promise<string | null> {
  if (!redisClient) return null;
  try {
    return await redisClient.get(key);
  } catch (error) {
    logger.error('Cache get failed', { key, error });
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttl: number = 3600): Promise<void> {
  if (!redisClient) return;
  try {
    await redisClient.setEx(key, ttl, value);
  } catch (error) {
    logger.error('Cache set failed', { key, error });
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Cache delete failed', { key, error });
  }
}
