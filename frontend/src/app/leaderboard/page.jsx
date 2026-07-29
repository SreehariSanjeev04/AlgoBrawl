"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import axios from "axios";
import TerminalHeader from "@/components/ui/TerminalHeader";
import Card from "@/components/ui/Card";
import SectionLabel from "@/components/ui/SectionLabel";

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const { loading, isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URI || "http://localhost:5000/api";

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${BACKEND_URI}/user`);
        setLeaderboardData(response.data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    if (!loading && isAuthenticated && user?.id) {
      fetchLeaderboard();
    }
  }, [isAuthenticated, loading, user]);

  return (
    <div className="min-h-screen bg-[#08090a]">
      <TerminalHeader
        user={user}
        isAuthenticated={isAuthenticated}
        loading={loading}
        onLogout={logout}
      />

      <div className="relative">
        <div className="absolute inset-0 bg-grid pointer-events-none h-48" />

        <div className="relative max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-surface-2 border border-[var(--border-default)] flex items-center justify-center">
              <span className="text-[11px] font-mono text-warning">#</span>
            </div>
            <div>
              <h1 className="text-[15px] font-mono font-semibold text-zinc-100">
                Leaderboard
              </h1>
              <SectionLabel>global rankings</SectionLabel>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--border-default)]">
            <div className="grid grid-cols-12 gap-0 bg-surface-1 border-b border-[var(--border-default)]">
              <div className="col-span-2 px-4 py-2.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">#</span>
              </div>
              <div className="col-span-7 px-4 py-2.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Player</span>
              </div>
              <div className="col-span-3 px-4 py-2.5 text-right">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Rating</span>
              </div>
            </div>

            <div className="divide-y divide-[var(--border-default)]">
              {leaderboardData.map((usr, index) => {
                const isCurrentUser = usr?.username === user?.username;
                return (
                  <div
                    key={usr.id || usr.username}
                    className={`grid grid-cols-12 gap-0 px-4 py-2.5 text-[12px] ${
                      isCurrentUser ? "bg-accent-subtle/10" : "bg-surface-1"
                    }`}
                  >
                    <div className="col-span-2 flex items-center">
                      <span
                        className={`font-mono ${
                          index < 3
                            ? "text-warning"
                            : isCurrentUser
                            ? "text-accent"
                            : "text-zinc-500"
                        }`}
                      >
                        #{index + 1}
                      </span>
                    </div>
                    <div className="col-span-7 flex items-center gap-2">
                      <span
                        className={`font-medium ${
                          isCurrentUser ? "text-accent-light" : "text-zinc-200"
                        }`}
                      >
                        {usr.username}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent-subtle/30 text-accent-light uppercase tracking-wider">
                          you
                        </span>
                      )}
                    </div>
                    <div className="col-span-3 flex items-center justify-end">
                      <span className="font-mono text-zinc-300">
                        {usr.rating}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;