/**
 * Custom HTTP error with statusCode.
 * Used in services to throw errors with the correct HTTP status — errorHandler maps them automatically.
 *
 * @example
 *   throw new AppError("Match not found.", 404);
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
 * Factory function for AppError — alternative syntax.
 * @example
 *   throw createHttpError("Not found.", 404);
 */
export const createHttpError = (message, statusCode = 500) =>
  new AppError(message, statusCode);
