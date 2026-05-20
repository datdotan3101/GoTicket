import { redis } from "../config/redis.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { sendError } from "../utils/response.js";

/**
 * Factory để tạo middleware Rate Limiter bằng Redis
 */
export const createRateLimiter = ({
  windowMs = 60000, // Mặc định 1 phút
  max = 100, // Giới hạn lượt request
  keyPrefix = "rl",
  message = "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút."
}) => {
  return async (req, res, next) => {
    if (!redis) {
      // Bỏ qua giới hạn nếu không cấu hình Redis (Fail-open)
      return next();
    }

    try {
      // Lấy IP của client
      const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
      // Chuẩn hoá IP (trong trường hợp local IPv6)
      const ip = rawIp.includes("::ffff:") ? rawIp.split("::ffff:")[1] : rawIp;
      
      const windowTimestamp = Math.floor(Date.now() / windowMs);
      const key = `${keyPrefix}:${ip}:${windowTimestamp}`;

      // Tăng bộ đếm
      const current = await redis.incr(key);

      // Thiết lập TTL cho key mới
      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      // Đính kèm các header RateLimit tiêu chuẩn
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - current));

      if (current > max) {
        return sendError(res, message, HTTP_STATUS.TOO_MANY_REQUESTS);
      }

      next();
    } catch (error) {
      console.error("Rate Limiter Error:", error);
      // Tiếp tục thực hiện API nếu Redis bị lỗi (đảm bảo hệ thống không chết đứng)
      next();
    }
  };
};

// Rate limiter chuyên dụng cho API Login/Register (Tránh brute force)
export const authLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 phút
  max: 5, // 5 lần thử
  keyPrefix: "rl:auth",
  message: "Đăng nhập sai quá nhiều lần. Vui lòng đợi 1 phút."
});

// Rate limiter chung cho toàn bộ ứng dụng
export const globalLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 phút
  max: 100, // 100 requests
  keyPrefix: "rl:global",
  message: "Yêu cầu quá nhanh. Vui lòng tải lại trang sau ít phút."
});

// Rate limiter cho API AI (Vì AI tốn kém tài nguyên)
export const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 phút
  max: 10, // 10 requests
  keyPrefix: "rl:ai",
  message: "Số lượt sử dụng AI đã đạt giới hạn trong phút này. Vui lòng đợi."
});
