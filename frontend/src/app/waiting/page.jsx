"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import socket from "../socket/socket";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import TerminalHeader from "@/components/ui/TerminalHeader";
import Button from "@/components/ui/Button";
import StatusDot from "@/components/ui/StatusDot";
import SectionLabel from "@/components/ui/SectionLabel";

export default function MatchWaitingPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [elapsed, setElapsed] = useState(0);
  const difficulty = ["Easy", "Medium", "Hard"];

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (loading || !isAuthenticated || !user?.id) return;

    const x = Math.min(1, Math.max(0, (user.rating - 600) / 1400));
    const p_easy = (1 - x) ** 2;
    const p_medium = 2 * x * (1 - x);
    const p_hard = x ** 2;

    const randomProbability = Math.random();
    let idx = 0;
    if (randomProbability >= p_easy + p_medium) idx = 2;
    else if (randomProbability >= p_easy) idx = 1;

    const timer = setInterval(() => setElapsed((t) => t + 1), 1000);

    const onConnect = () => {
      socket.emit("join-matchmaking", {
        id: user.id,
        difficulty: difficulty[idx],
        rating: user.rating,
      });
    };

    const onMatchStarted = ({ roomId }) => {
      toast.success("Match found!");
      clearInterval(timer);
      setTimeout(() => router.replace(`/match/${roomId}`), 2000);
    };

    const onError = (err) => toast.error(`Socket error: ${err.message}`);

    if (socket.connected) {
      socket.connect();
      onConnect();
    }

    socket.on("match-started", onMatchStarted);
    socket.on("connect_error", onError);

    return () => {
      clearInterval(timer);
      socket.off("match-started", onMatchStarted);
      socket.off("connect_error", onError);
    };
  }, [loading, isAuthenticated, user?.id]);

  const handleCancel = () => {
    socket.emit("leave-matchmaking", { id: user?.id }, (response) => {
      if (response.status === "ok") {
        toast.success("Left matchmaking");
        router.push("/dashboard");
      } else {
        toast.error("Error leaving matchmaking");
      }
    });
  };

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div className="min-h-screen bg-[#08090a]">
      <TerminalHeader
        user={user}
        isAuthenticated={isAuthenticated}
        loading={loading}
        onLogout={logout}
      />

      <div className="relative min-h-[calc(100vh-44px)] flex items-center justify-center">
        <div className="absolute inset-0 bg-grid pointer-events-none" />

        <div className="relative flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <StatusDot status="online" />
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              searching for opponent
            </span>
          </div>

          <div className="text-center">
            <p className="text-[32px] font-mono font-bold tracking-tight text-zinc-100 tabular-nums">
              {formatElapsed(elapsed)}
            </p>
            <SectionLabel className="mt-1">elapsed time</SectionLabel>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          </div>

          <p className="text-[12px] text-zinc-500">Preparing your battle arena...</p>

          <Button variant="secondary" size="sm" onClick={handleCancel} className="mt-4">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}