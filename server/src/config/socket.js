import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";

let ioInstance;

/**
 * Khởi tạo Socket.IO với JWT auth middleware.
 *
 * Client cần truyền token khi connect:
 *   const socket = io(SERVER_URL, { auth: { token: "Bearer <jwt>" } });
 *
 * Sau khi verify thành công:
 * - socket.userId được gắn tự động
 * - Tự động join room user:{userId} — không cần emit join:user thủ công
 */
export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*"
    }
  });

  // JWT Auth Middleware — verify trước khi accept connection
  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token?.replace("Bearer ", "");

    if (!token) {
      // Cho phép connect ẩn danh (audience chưa đăng nhập vẫn cần xem seat map realtime)
      socket.userId = null;
      return next();
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.id;
      socket.userRole = payload.role;
      socket.clubId = payload.club_id;
      return next();
    } catch (err) {
      logger.warn(`[Socket] Invalid token from ${socket.handshake.address}: ${err.message}`);
      // Không reject — cho phép connect nhưng không gắn userId
      socket.userId = null;
      return next();
    }
  });

  ioInstance.on("connection", (socket) => {
    // Tự động join user room nếu đã auth
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      logger.debug(`[Socket] User ${socket.userId} connected (${socket.id})`);
    }

    // Join match room để nhận seat updates realtime
    socket.on("join:match", (matchId) => {
      if (!matchId) return;
      socket.join(`match:${matchId}`);
    });

    // Legacy: vẫn hỗ trợ join:user manual (backward compat)
    socket.on("join:user", (userId) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        logger.debug(`[Socket] User ${socket.userId} disconnected (${socket.id})`);
      }
    });
  });

  return ioInstance;
};

export const getIo = () => ioInstance;

export const emitToMatch = (matchId, eventName, payload) => {
  if (!ioInstance || !matchId) return;
  ioInstance.to(`match:${matchId}`).emit(eventName, payload);
};

export const emitToUser = (userId, eventName, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(eventName, payload);
};
