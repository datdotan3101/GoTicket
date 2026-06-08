import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";

let ioInstance;

/**
 * Initialize Socket.IO with JWT auth middleware.
 *
 * Client must pass token when connecting:
 *   const socket = io(SERVER_URL, { auth: { token: "Bearer <jwt>" } });
 *
 * After successful verification:
 * - socket.userId is automatically attached
 * - Automatically joins room user:{userId} — no need to manually emit join:user
 */
export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*"
    }
  });

  // JWT Auth Middleware — verify before accepting connection
  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token?.replace("Bearer ", "");

    if (!token) {
      // Allow anonymous connections (unauthenticated audience still needs realtime seat map)
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
      // Do not reject — allow connection but without userId attached
      socket.userId = null;
      return next();
    }
  });

  ioInstance.on("connection", (socket) => {
    // Automatically join user room if authenticated
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      logger.debug(`[Socket] User ${socket.userId} connected (${socket.id})`);
    }

    // Join match room to receive realtime seat updates
    socket.on("join:match", (matchId) => {
      if (!matchId) return;
      socket.join(`match:${matchId}`);
    });

    // Legacy: still support manual join:user (backward compat)
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



export const emitToMatch = (matchId, eventName, payload) => {
  if (!ioInstance || !matchId) return;
  ioInstance.to(`match:${matchId}`).emit(eventName, payload);
};

export const emitToUser = (userId, eventName, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(eventName, payload);
};
