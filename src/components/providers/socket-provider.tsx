"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";
import { io as ClientIO, Socket } from "socket.io-client";

type SocketContextType = {
    socket: Socket | null;
    isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({
    children
}: {
    children: React.ReactNode
}) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Get the current origin (protocol + host)
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        
        console.log("[SocketProvider] Connecting to socket at:", origin);
        
        // Use polling transport which is more reliable in Next.js
        const socketInstance = ClientIO(origin, {
            path: "/api/socket/io",
            addTrailingSlash: false,
            transports: ['polling'], // Use polling instead of websocket for Next.js compatibility
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketInstance.on("connect", () => {
            console.log("[SocketProvider] Socket connected, ID:", socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            console.log("[SocketProvider] Socket disconnected");
            setIsConnected(false);
        });

        socketInstance.on("connect_error", (error) => {
            console.error("[SocketProvider] Connection error:", error);
        });

        setSocket(socketInstance);

        return () => {
            console.log("[SocketProvider] Cleaning up socket connection");
            socketInstance.disconnect();
        }
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    )
}
