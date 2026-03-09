import { useEffect, useState } from "react";
import { io as ClientIO } from "socket.io-client";
import { useAuth } from "@clerk/clerk-expo";

export const useSocket = () => {
    const [socket, setSocket] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { getToken } = useAuth();

    useEffect(() => {
        const initSocket = async () => {
            const token = await getToken();
            
            const socketInstance = new (ClientIO as any)(process.env.EXPO_PUBLIC_API_URL!, {
                path: "/api/socket/io",
                addTrailingSlash: false,
                auth: {
                    token: token
                }
            });

            socketInstance.on("connect", () => {
                setIsConnected(true);
            });

            socketInstance.on("disconnect", () => {
                setIsConnected(false);
            });

            setSocket(socketInstance);
        };

        initSocket();

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    return { 
        socket, 
        isConnected 
    };
};
