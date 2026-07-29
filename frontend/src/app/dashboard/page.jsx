"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoadingScreen from "@/components/LoadingPage/LoadingPage";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import TerminalHeader from "@/components/ui/TerminalHeader";
import Card from "@/components/ui/Card";
import SectionLabel from "@/components/ui/SectionLabel";
import StatusDot from "@/components/ui/StatusDot";
import Button from "@/components/ui/Button";

const UserDashboard = () => {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const [details, setDetails] = useState(null);
  const [matches, setMatches] = useState([]);
  const [shouldRender, setShouldRender] = useState(false);
  const router = useRouter();
  const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URI;

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.id || !isAuthenticated) return;
      try {
        const [userRes, matchRes] = await Promise.all([
          axios.get(`${BACKEND_URI}/user/${user.id}`),
          axios.post(
            `${BACKEND_URI}/user/get-matches`,
            { user_id: user.id },
            { withCredentials: true }
          ),
        ]);

        if (userRes.status === 200) {
          setDetails(userRes.data.user);
        } else {
          toast.error("Failed to fetch user details.");
          logout();
          router.replace("/login");
        }

        if (matchRes.status === 200) {
          setMatches(matchRes.data.matches);
        } else {
          toast.error("Failed to fetch match history.");
          logout();
          router.replace("/login");
        }
      } catch (error) {
        toast.error("Session expired or data fetch failed.");
        logout();
        router.replace("/login");
      }
    };

    if (!loading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else {
        fetchUserDetails();
        setShouldRender(true);
      }
    }
  }, [user, loading, isAuthenticated]);

  if (loading || !shouldRender) {
    return <LoadingScreen />;
  }

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

        <div className="relative max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-surface-2 border border-[var(--border-default)] flex items-center justify-center">
              <span className="text-[11px] font-mono text-accent">
                ~
              </span>
            </div>
            <div>
              <h1 className="text-[15px] font-mono font-semibold text-zinc-100">
                {user?.username}
              </h1>
              <SectionLabel>user dashboard</SectionLabel>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[var(--border-default)] rounded-lg overflow-hidden mb-8">
            <Card hover={false} className="p-5 border-0 rounded-none">
              <SectionLabel>rating</SectionLabel>
              <p className="text-[22px] font-mono font-bold text-accent mt-1">
                {details?.rating ?? "—"}
              </p>
            </Card>

            <Card hover={false} className="p-5 border-0 rounded-none">
              <SectionLabel>matches played</SectionLabel>
              <p className="text-[22px] font-mono font-bold text-zinc-100 mt-1">
                {details?.matches_played ?? "—"}
              </p>
            </Card>

            <Card hover={false} className="p-5 border-0 rounded-none">
              <SectionLabel>wins</SectionLabel>
              <p className="text-[22px] font-mono font-bold text-zinc-100 mt-1">
                {details?.wins ?? "—"}
              </p>
            </Card>
          </div>

          <div className="mb-8">
            <SectionLabel className="mb-3 block">match history</SectionLabel>
            <Card className="p-0 divide-y divide-[var(--border-default)] overflow-hidden">
              {matches.length > 0 ? (
                matches.map((match, index) => {
                  const isPlayer1 = match.player1_id === user.id;
                  const opponent = isPlayer1
                    ? match.Player2?.username
                    : match.Player1?.username;

                  let status;
                  if (match.winner === user.id) {
                    status = { label: "win", dot: "online" };
                  } else if (match.winner === null || match.winner === -1) {
                    status = { label: "draw", dot: "away" };
                  } else {
                    status = { label: "loss", dot: "offline" };
                  }

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-2.5 text-[12px]"
                    >
                      <div className="flex items-center gap-2.5">
                        <StatusDot status={status.dot} />
                        <span className="text-zinc-400">vs</span>
                        <span className="text-zinc-200 font-medium">
                          {opponent || "Unknown"}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-mono ${
                          status.label === "win"
                            ? "text-accent"
                            : status.label === "loss"
                            ? "text-danger"
                            : "text-warning"
                        }`}
                      >
                        {status.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-center text-[12px] text-zinc-500">
                  No matches played yet.
                </div>
              )}
            </Card>
          </div>

          <Button variant="ghost" size="xs" onClick={logout}>
            &rarr; logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;