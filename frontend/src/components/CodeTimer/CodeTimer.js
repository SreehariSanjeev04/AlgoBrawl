import React, { useEffect, useState } from "react";
import socket from "@/app/socket/socket";
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const CodeTimer = ({ duration }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  useEffect(() => {
    socket.on("match-time", ({ duration }) => {
      setTimeLeft(duration);
    });
    return () => {
      socket.off("match-time");
    };
  }, []);

  return (
    <div className="ml-auto text-white text-sm font-mono bg-gray-700 px-3 py-1 rounded">
      Time Left: {formatTime(timeLeft)}
    </div>
  );
};

export default CodeTimer;
