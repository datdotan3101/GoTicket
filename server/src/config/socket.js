import { Server } from "socket.io";

let ioInstance;

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*"
    }
  });

  ioInstance.on("connection", (socket) => {
    socket.on("join:match", (matchId) => {
      if (!matchId) return;
      socket.join(`match:${matchId}`);
    });

    socket.on("join:user", (userId) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
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
