import socket from "@/app/socket/socket";
import { createContext, useEffect } from "react";

const SocketContext = createContext({
  socket: null,
  isConnected: false,
});

const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  const onConnect = () => {
    console.log("Socket connected with ID:", socket.id);
    setIsConnected(true);
  };
  const onDisconnect = () => {
    console.log("Socket disconnected");
    setIsConnected(false);
  }

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
      console.log("Socket connected from provider");
    }

    socket.on("connect", onConnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext, SocketProvider };
