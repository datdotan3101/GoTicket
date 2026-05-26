import { redis } from "../config/redis.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { sendError } from "../utils/response.js";

/**
 * Factory for creating a Redis-based Rate Limiter middleware
 */
export const createRateLimiter = ({
  windowMs = 60000, // Default: 1 minute
  max = 100, // Request limit
  keyPrefix = "rl",
  message = "You have sent too many requests. Please try again in a few minutes."
}) => {
  return async (req, res, next) => {
    if (!redis) {
      // Skip limiting if Redis is not configured (Fail-open)
      return next();
    }

    try {
      // Get client IP
      const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
      // Normalize IP (for local IPv6)
      const ip = rawIp.includes("::ffff:") ? rawIp.split("::ffff:")[1] : rawIp;
      
      const windowTimestamp = Math.floor(Date.now() / windowMs);
      const key = `${keyPrefix}:${ip}:${windowTimestamp}`;

      // Increment counter
      const current = await redis.incr(key);

      // Set TTL for new keys
      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      // Attach standard RateLimit headers
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - current));

      if (current > max) {
        return sendError(res, message, HTTP_STATUS.TOO_MANY_REQUESTS);
      }

      next();
    } catch (error) {
      console.error("Rate Limiter Error:", error);
      // Continue serving the API if Redis fails (prevent system from crashing)
      next();
    }
  };
};

// Dedicated rate limiter for Login/Register API (prevent brute force)
export const authLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts
  keyPrefix: "rl:auth",
  message: "Too many failed login attempts. Please wait 1 minute."
});

// Global rate limiter for the entire application
export const globalLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests
  keyPrefix: "rl:global",
  message: "Too many requests. Please try again in a few minutes."
});

// Rate limiter for AI API (AI is resource-intensive)
export const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests
  keyPrefix: "rl:ai",
  message: "AI usage limit reached for this minute. Please wait."
});
