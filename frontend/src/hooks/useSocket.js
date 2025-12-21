import { SocketContext } from "@/providers/SocketProvider";
import { useContext } from "react";

export const useSocket = () => useContext(SocketContext);