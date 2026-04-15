import { HTTP_STATUS } from "../constants/httpStatus.js";
import { sendError } from "../utils/response.js";

export const notFoundHandler = (req, res) => {
  return sendError(res, "Endpoint không tồn tại.", HTTP_STATUS.NOT_FOUND);
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  return sendError(res, err.message || "Internal server error", statusCode);
};
