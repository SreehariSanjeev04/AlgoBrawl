import { io } from "socket.io-client";

const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access-token");
};

const socket = io("http://localhost:5000", {
  autoConnect: false,
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  auth: { token: getAccessToken() },
});

export default socket;
