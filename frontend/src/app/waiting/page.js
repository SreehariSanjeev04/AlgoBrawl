"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import socket from "../socket/socket";
import { toast } from "sonner";

export default function MatchWaitingPage() {
  const router = useRouter();

  const handleCancel = () => {
    socket.emit("leave-matchmaking", { id: "123" });
    router.push("/dashboard");
  };

  useEffect(() => {
    const onConnect = () => {
      console.log("Connected to server with ID: ", socket.id);
      socket.emit("join-matchmaking", {
        id: "123",
        difficulty: "Easy",
      });
    };
    const onMatchStarted = () => {
      toast.success("Match Started")
      
      // for notification
      setTimeout(() => {
        router.replace("/match");
      }, 2000)
    };
    socket.on("connect_error", (err) => {
      toast.error(err.message);
    });

    // acknowledging back
    socket.on("join-room", (roomId, ack) => {
      ack();
    });

    socket.on("connect", onConnect);

    socket.on("match-started", onMatchStarted);

    if (!socket.connected) {
      console.log("Calling socket.connect()");
      socket.connect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("match-started", onMatchStarted);
    };
  }, []);

  return (
    <main className="flex items-center justify-center h-screen bg-gray-900 text-white px-4">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold text-green-400 tracking-widest">
          AlgoBrawl
        </h1>

        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-400" />
          <p className="text-xl font-medium text-gray-300">
            Searching for an opponents
          </p>
        </div>

        <button
          onClick={handleCancel}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white font-semibold transition"
        >
          Cancel Match
        </button>
      </div>
    </main>
  );
}
