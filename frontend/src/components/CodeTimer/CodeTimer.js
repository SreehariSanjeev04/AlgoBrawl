import React, { useEffect, useState } from "react";
import socket from "@/app/socket/socket";

const formatTime = (seconds) => {
  if (seconds === Infinity || !seconds) return "--:--";
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
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

  const isLow = timeLeft > 0 && timeLeft <= 60;

  return (
    <div className={`font-mono text-[13px] tabular-nums ${isLow ? "text-danger" : "text-zinc-400"}`}>
      <span className="text-[10px] uppercase tracking-wider text-zinc-600 mr-2">
        time left
      </span>
      {formatTime(timeLeft)}
    </div>
  );
};

export default CodeTimer;