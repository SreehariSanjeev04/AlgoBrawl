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

      socket.emit("online");

      toast.dismiss();
      toast.success("You are now online!");
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    };

    const handleConnectError = (err) => {
      console.error("Socket connection error:", err.message);
      setIsConnected(false);
      toast.error("Socket connection failed. Please re-login if it persists.");
    };


    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    socket.auth = { token: localStorage.getItem("access-token") };
    if (!socket.connected) {
      socket.connect();
    } else {

      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [loading, isAuthenticated, user?.id]); 

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};