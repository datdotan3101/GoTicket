import jwt from "jsonwebtoken";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { sendError } from "../utils/response.js";
import { redis } from "../config/redis.js";

export const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return sendError(res, "Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }

  const token = header.replace("Bearer ", "");
  try {
    // Kiểm tra token đã bị blacklist chưa
    if (redis) {
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return sendError(res, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", HTTP_STATUS.UNAUTHORIZED);
      }
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    return sendError(res, "Token không hợp lệ hoặc đã hết hạn.", HTTP_STATUS.UNAUTHORIZED);
  }
};
