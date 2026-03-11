import React, { createContext, useContext, useEffect, useState } from "react";
import { io as ClientIO } from "socket.io-client";
import { useAuth } from "@clerk/clerk-expo";

interface SocketContextType {
  socket: any | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocketContext = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    let socketInstance: any = null;

    const initSocket = async () => {
      const token = await getToken();
      const apiUrl = process.env.EXPO_PUBLIC_API_URL!;
      console.log("[SocketProvider] Initializing with URL:", apiUrl);
      
      socketInstance = new (ClientIO as any)(apiUrl, {
        path: "/api/socket/io",
        addTrailingSlash: false,
        transports: ['polling', 'websocket'], // Start with polling for stability, upgrade to websocket
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        randomizationFactor: 0.5,
      });

      socketInstance.on("connect", () => {
        setIsConnected(true);
        console.log("[SocketProvider] Connected (Transport:", socketInstance.io?.engine?.transport?.name, ")");
      });

      socketInstance.on("disconnect", (reason: string) => {
        setIsConnected(false);
        console.log("[SocketProvider] Disconnected:", reason);
      });

      socketInstance.on("connect_error", (error: any) => {
        console.log("[SocketProvider] Connection Error:", error.message);
        // If websocket fails, it will automatically try polling because of the transport order
      });

      setSocket(socketInstance);
    };

    initSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isSignedIn]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
