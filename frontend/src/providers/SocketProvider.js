"use client";

import socket from "@/app/socket/socket";
import { createContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const SocketContext = createContext({
  socket: null,
  isConnected: false,
});

const SocketProvider = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);

  const onConnect = () => {
    console.log("Socket connected with ID:", socket.id);
    setIsConnected(true);
  };
  const onDisconnect = () => {
    console.log("Socket disconnected");
    setIsConnected(false);
  };

  useEffect(() => {
    if (!socket.connected && !loading && isAuthenticated && user?.id) {
      socket.connect();
      console.log("Socket connected from provider");
    } else return;

    socket.on("connect", onConnect);

    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [loading, isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext, SocketProvider };
