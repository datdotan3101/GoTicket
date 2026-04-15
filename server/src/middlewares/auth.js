import jwt from "jsonwebtoken";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { sendError } from "../utils/response.js";

export const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return sendError(res, "Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }

  const token = header.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    return sendError(res, "Token không hợp lệ hoặc đã hết hạn.", HTTP_STATUS.UNAUTHORIZED);
  }
};
