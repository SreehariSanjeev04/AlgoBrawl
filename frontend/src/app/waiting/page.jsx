"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import socket from "../socket/socket";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function MatchWaitingPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();


  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated]);

  
  useEffect(() => {
    if (loading || !isAuthenticated || !user?.id) return;
    console.log("Rating:", user.rating);
    const onConnect = () => {
      console.log("Connected to server with ID:", socket.id);
      socket.emit("join-matchmaking", {
        id: user.id,
        difficulty: "Easy",
        rating: user.rating
      });
    };

    const onMatchStarted = ({ roomId }) => {
      toast.success("Match Started");
      setTimeout(() => {
        router.replace(`/match/${roomId}`);
      }, 2000);
    };

    const onError = (err) => toast.error(`Socket error: ${err.message}`);

    socket.on("connect", onConnect);
    socket.on("match-started", onMatchStarted);
    socket.on("connect_error", onError);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("match-started", onMatchStarted);
      socket.off("connect_error", onError);
    };
  }, [loading, isAuthenticated, user?.id]);

  const handleCancel = () => {
    socket.emit("leave-matchmaking", { id: user?.id });
    router.push("/dashboard");
  };

  return (
    <main className="flex items-center justify-center h-screen bg-gray-900 text-white px-4">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold text-green-400 tracking-widest">
          AlgoBrawl
        </h1>

        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-400" />
          <p className="text-xl font-medium text-gray-300">
            Searching for opponents...
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
