import { useSocketContext } from "@/providers/socket-provider";

export const useSocket = () => {
    const { socket, isConnected } = useSocketContext();
    return { 
        socket, 
        isConnected 
    };
};
