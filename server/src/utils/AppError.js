/**
 * Custom HTTP error với statusCode.
 * Dùng ở service để ném lỗi với đúng HTTP status — errorHandler sẽ map tự động.
 *
 * @example
 *   throw new AppError("Không tìm thấy trận đấu.", 404);
 *   throw new AppError("Forbidden.", 403);
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

/**
 * Factory function cho AppError — alternative syntax.
 * @example
 *   throw createHttpError("Không tìm thấy.", 404);
 */
export const createHttpError = (message, statusCode = 500) =>
  new AppError(message, statusCode);
