"use client";

import socket from "@/app/socket/socket";
import { createContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const SocketContext = createContext({
  socket: null,
  isConnected: false,
});

export const SocketProvider = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {

    if (loading || !isAuthenticated || !user?.id) return;

    const handleConnect = () => {
      console.log("Socket connected with ID:", socket.id);
      setIsConnected(true);
      

      socket.emit("online", {
        id: user.id,
        username: user.username,
        rating: user.rating,
      });
      
      toast.dismiss();
      toast.success("You are now online!");
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    };


    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (!socket.connected) {
      socket.connect();
    } else {

      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [loading, isAuthenticated, user?.id]); 

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};