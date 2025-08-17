"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import socket from "../socket/socket";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { MoonLoader } from "react-spinners";

export default function MatchWaitingPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const difficulty = ["Easy", "Medium", "Hard"];


  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated]);

  
  useEffect(() => {
    if (loading || !isAuthenticated || !user?.id) return;

    const x = Math.min(1, Math.max(0, (user.rating - 600) / 1400));
    const p_easy = (1 - x)**2;
    const p_medium = 2 * x * (1 - x);
    const p_hard = x**2;

    const randomProbability = Math.random();

    let idx = 0;
    if(randomProbability < p_easy) idx = 0;
    else if(randomProbability < p_easy + p_medium) idx = 1;
    else idx = 2;

    const onConnect = () => {
      console.log("Connected to server with ID:", socket.id);
      socket.emit("join-matchmaking", {
        id: user.id,
        difficulty: difficulty[idx],
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
          <div className="flex flex-col items-center gap-6 animate-fadeIn">
            <MoonLoader color="#a855f7" size={60} />
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
              AlgoBrawl
            </h1>
            <p className="text-sm text-gray-400">Preparing your battle arena...</p>
          </div>
        </div>  
  );
}
