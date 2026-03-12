import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";

import { NextApiResponseServerIo } from "@/types";

export const config = {
    api: {
        bodyParser: false,
    },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
    if (!res.socket.server.io) {
        console.log("[Socket.io] Initializing Socket.io server...");
        
        const path = "/api/socket/io";
        const httpServer: NetServer = res.socket.server as any;
        const io = new ServerIO(httpServer, {
            path: path,
            addTrailingSlash: false,
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling'], 
            pingTimeout: 60000,
            pingInterval: 25000,
            connectTimeout: 45000,
            allowEIO3: true
        });

        io.on("connection", (socket) => {
            console.log("[Socket.io] Client connected:", socket.id);
            
            socket.on("typing:start", ({ chatId, userName }) => {
                socket.broadcast.emit(`chat:${chatId}:typing`, { userName, isTyping: true });
            });

            socket.on("typing:stop", ({ chatId }) => {
                socket.broadcast.emit(`chat:${chatId}:typing`, { isTyping: false });
            });
            
            socket.on("disconnect", () => {
                console.log("[Socket.io] Client disconnected:", socket.id);
            });
        });

        res.socket.server.io = io;
        console.log("[Socket.io] Socket.io server initialized");
    }

    res.end();
}

export default ioHandler;
