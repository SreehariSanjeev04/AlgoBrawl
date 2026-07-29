"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import TerminalHeader from "@/components/ui/TerminalHeader";
import Button from "@/components/ui/Button";
import SectionLabel from "@/components/ui/SectionLabel";
import Card from "@/components/ui/Card";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  const handleRedirect = () => {
    if (!loading) {
      router.push(isAuthenticated && user?.id ? "/waiting" : "/login");
    }
  };

  useEffect(() => {
    if (isAuthenticated && isConnected) {
      socket.emit(
        "online",
        { id: user.id, username: user.username, rating: user.rating },
        toast.dismiss(),
        toast.success("You are now online!")
      );
    } else if (isAuthenticated) {
      toast.loading("Connecting to server...");
    }
  }, [isAuthenticated, isConnected, socket]);

  return (
    <div className="min-h-screen bg-[#08090a] text-zinc-100">
      <TerminalHeader
        user={user}
        isAuthenticated={isAuthenticated}
        loading={loading}
        isConnected={isConnected}
        onLogout={logout}
      />

      <main>
        <section className="relative border-b border-[var(--border-default)]">
          <div className="absolute inset-0 bg-grid pointer-events-none" />
          <div className="relative max-w-3xl mx-auto px-6 py-32 sm:py-40 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-1 border border-[var(--border-default)] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] font-mono text-zinc-500">
                Live matchmaking &middot; Real-time coding battles
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-zinc-100 mb-4">
              Code.<br className="sm:hidden" /> Compete.<br className="sm:hidden" /> Conquer.
            </h1>

            <p className="text-[14px] text-zinc-500 max-w-xl mx-auto mb-10 leading-relaxed">
              Match up with coders worldwide in real-time. Solve the same challenge. First to finish wins.
            </p>

            <div className="flex items-center justify-center gap-3">
              <Button variant="primary" size="md" onClick={handleRedirect}>
                Start a Match
              </Button>
              <Link href="/login">
                <Button variant="secondary" size="md">
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <SectionLabel>Platform Features</SectionLabel>
          </div>

          <div className="grid gap-px bg-[var(--border-default)] rounded-lg overflow-hidden sm:grid-cols-3">
            <Card hover={false} className="p-6 border-0 rounded-none">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-mono text-accent uppercase tracking-wider">01</span>
              </div>
              <h3 className="text-[13px] font-semibold text-zinc-200 mb-1.5">
                Live Duels
              </h3>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                Instant matchmaking with players near your skill level.
              </p>
            </Card>

            <Card hover={false} className="p-6 border-0 rounded-none">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-mono text-accent uppercase tracking-wider">02</span>
              </div>
              <h3 className="text-[13px] font-semibold text-zinc-200 mb-1.5">
                Same Problem, Same Time
              </h3>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                Face off on the exact same challenge and win by speed + skill.
              </p>
            </Card>

            <Card hover={false} className="p-6 border-0 rounded-none">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-mono text-accent uppercase tracking-wider">03</span>
              </div>
              <h3 className="text-[13px] font-semibold text-zinc-200 mb-1.5">
                Rankings &amp; Replays
              </h3>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                Track your progress and watch replays of your matches.
              </p>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border-default)] py-5 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-600">
            &copy; 2025 algobrawl
          </span>
          <span className="text-[11px] font-mono text-zinc-600">
            built for coders, by coders
          </span>
        </div>
      </footer>
    </div>
  );
}