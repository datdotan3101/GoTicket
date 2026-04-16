import { HTTP_STATUS } from "../constants/httpStatus.js";
import { sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export const notFoundHandler = (req, res) => {
  return sendError(res, `Endpoint không tồn tại: ${req.method} ${req.path}`, HTTP_STATUS.NOT_FOUND);
};

/**
 * Error handler tập trung — phân loại lỗi để trả đúng HTTP status code.
 *
 * Thứ tự ưu tiên:
 * 1. AppError (có statusCode) — dùng statusCode của lỗi
 * 2. PostgreSQL errors — map sang 409 Conflict
 * 3. JWT errors — map sang 401 Unauthorized
 * 4. Stripe errors — map sang 402 Payment Required
 * 5. Mặc định: 500 Internal Server Error
 */
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal server error";

  // PostgreSQL unique violation
  if (err.code === "23505") {
    statusCode = HTTP_STATUS.CONFLICT;
    message = "Dữ liệu đã tồn tại (vi phạm ràng buộc unique).";
  }
  // PostgreSQL foreign key violation
  else if (err.code === "23503") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Dữ liệu tham chiếu không hợp lệ (foreign key).";
  }
  // PostgreSQL not null violation
  else if (err.code === "23502") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Thiếu dữ liệu bắt buộc: ${err.column || "unknown"}.`;
  }
  // JWT errors
  else if (err.name === "JsonWebTokenError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = "Token không hợp lệ.";
  }
  else if (err.name === "TokenExpiredError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = "Token đã hết hạn.";
  }
  // Stripe errors
  else if (err.type?.startsWith("Stripe")) {
    statusCode = 402;
    message = err.message;
  }

  // Log lỗi server-side (500+) — không log client errors để tránh noise
  if (statusCode >= 500) {
    logger.error(
      `[${req.method}] ${req.path} → ${statusCode}: ${message}`,
      process.env.NODE_ENV !== "production" ? err : undefined
    );
  } else if (statusCode >= 400) {
    logger.warn(`[${req.method}] ${req.path} → ${statusCode}: ${message}`);
  }

  return sendError(res, message, statusCode);
};
