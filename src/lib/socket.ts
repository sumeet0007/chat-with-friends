import { Server as ServerIO } from "socket.io";

let io: ServerIO | null = null;

export const setIO = (socketIO: ServerIO) => {
  io = socketIO;
};

export const getIO = (): ServerIO => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};
