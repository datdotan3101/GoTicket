import { redis } from "../config/redis.js";

/**
 * Lấy dữ liệu từ Cache Redis, nếu không có sẽ chạy hàm fetchFn để lấy dữ liệu từ DB rồi lưu vào Cache.
 * 
 * @param {string} key - Key của cache
 * @param {number} ttlSeconds - Thời gian sống của cache (giây)
 * @param {Function} fetchFn - Hàm bất đồng bộ để lấy dữ liệu gốc (từ DB)
 * @returns {Promise<any>} Dữ liệu trả về
 */
export const getOrSetCache = async (key, ttlSeconds, fetchFn) => {
  if (!redis) {
    // Nếu không có Redis, chạy trực tiếp hàm lấy dữ liệu từ DB
    return await fetchFn();
  }

  try {
    const cachedData = await redis.get(key);
    if (cachedData !== null) {
      // Đối với @upstash/redis, nếu giá trị lưu là JSON string thì nó có thể tự parse hoặc cần parse thủ công.
      // Để chắc chắn, chúng ta parse nếu nó là string, hoặc dùng trực tiếp nếu nó đã là Object.
      return typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
    }
  } catch (error) {
    console.error(`⚠️ Redis Cache Get Error (Key: ${key}):`, error.message);
  }

  // Lấy dữ liệu mới
  const freshData = await fetchFn();

  try {
    if (freshData !== undefined && freshData !== null) {
      // Lưu vào cache dạng JSON string
      await redis.set(key, JSON.stringify(freshData), { ex: ttlSeconds });
    }
  } catch (error) {
    console.error(`⚠️ Redis Cache Set Error (Key: ${key}):`, error.message);
  }

  return freshData;
};

/**
 * Xóa các cache key khớp với pattern (ví dụ: "sports:*")
 * 
 * @param {string} pattern - Pattern tìm kiếm key để xóa
 */
export const invalidateCache = async (pattern) => {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
      console.log(`🧹 Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error(`⚠️ Redis Cache Invalidation Error (Pattern: ${pattern}):`, error.message);
  }
};
