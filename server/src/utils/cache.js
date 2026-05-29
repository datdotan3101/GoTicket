import { redis } from "../config/redis.js";

/**
 * Retrieve data from Redis Cache; if not found, run fetchFn to get data from DB and store it in cache.
 * 
 * @param {string} key - Cache key
 * @param {number} ttlSeconds - Cache time-to-live in seconds
 * @param {Function} fetchFn - Async function to fetch the original data (from DB)
 * @returns {Promise<any>} Returned data
 */
export const getOrSetCache = async (key, ttlSeconds, fetchFn) => {
  if (!redis) {
    // If Redis is not available, run the fetch function directly
    return await fetchFn();
  }

  try {
    const cachedData = await redis.get(key);
    if (cachedData !== null) {
      // For @upstash/redis, if the stored value is a JSON string it may be auto-parsed or need manual parsing.
      // To be safe, parse if it's a string, or use directly if it's already an Object.
      return typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
    }
  } catch (error) {
    console.error(`⚠️ Redis Cache Get Error (Key: ${key}):`, error.message);
  }

  // Fetch fresh data
  const freshData = await fetchFn();

  try {
    if (freshData !== undefined && freshData !== null) {
      // Store in cache as JSON string
      await redis.set(key, JSON.stringify(freshData), { ex: ttlSeconds });
    }
  } catch (error) {
    console.error(`⚠️ Redis Cache Set Error (Key: ${key}):`, error.message);
  }

  return freshData;
};

/**
 * Invalidate cache keys matching a pattern (e.g. "sports:*")
 * 
 * @param {string} pattern - Pattern to search for keys to delete
 */
export const invalidateCache = async (pattern) => {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
      console.log(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error(`Redis Cache Invalidation Error (Pattern: ${pattern}):`, error.message);
  }
};
