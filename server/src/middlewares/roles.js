import { HTTP_STATUS } from "../constants/httpStatus.js";
import { sendError } from "../utils/response.js";

export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return sendError(res, "Forbidden", HTTP_STATUS.FORBIDDEN);
    }
    return next();
  };
};
