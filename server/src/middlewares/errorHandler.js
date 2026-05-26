import { HTTP_STATUS } from "../constants/httpStatus.js";
import { sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export const notFoundHandler = (req, res) => {
  return sendError(res, `Endpoint not found: ${req.method} ${req.path}`, HTTP_STATUS.NOT_FOUND);
};

/**
 * Centralized error handler — classifies errors to return the correct HTTP status code.
 *
 * Priority order:
 * 1. AppError (has statusCode) — use the error's statusCode
 * 2. PostgreSQL errors — map to 409 Conflict
 * 3. JWT errors — map to 401 Unauthorized
 * 4. Stripe errors — map to 402 Payment Required
 * 5. Default: 500 Internal Server Error
 */
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal server error";

  // PostgreSQL unique violation
  if (err.code === "23505") {
    statusCode = HTTP_STATUS.CONFLICT;
    message = "Data already exists (unique constraint violation).";
  }
  // PostgreSQL foreign key violation
  else if (err.code === "23503") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Invalid reference data (foreign key violation).";
  }
  // PostgreSQL not null violation
  else if (err.code === "23502") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Missing required field: ${err.column || "unknown"}.`;
  }
  // JWT errors
  else if (err.name === "JsonWebTokenError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = "Invalid token.";
  }
  else if (err.name === "TokenExpiredError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = "Token has expired.";
  }
  // Stripe errors
  else if (err.type?.startsWith("Stripe")) {
    statusCode = 402;
    message = err.message;
  }

  // Log server-side errors (500+) — do not log client errors to avoid noise
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
