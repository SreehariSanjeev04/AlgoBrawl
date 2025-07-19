"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const LeaderboardPage = () => {
  const BACKEND_URI = process.env.BACKEND_URI || "http://localhost:5000/api";
  const [leaderboardData, setLeaderboardData] = useState([]);
  const { loading, isAuthenticated, user } = useAuth();
  const router = useRouter()
  useEffect(() => {
    if (loading) return;

    if(!isAuthenticated) {
        router.replace("/login");
        return;
    }
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${BACKEND_URI}/user`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        const data = await response.json();
        setLeaderboardData(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    if(!loading && isAuthenticated && user?.id) {
      fetchLeaderboard();
    }
  }, [isAuthenticated, loading, user]);
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-10">Leaderboard</h1>
      <div className="max-w-3xl mx-auto space-y-4">
        {leaderboardData.map((usr, index) => (
          <div
            key={usr.username}
            className={`${usr?.username === user?.username ? "bg-gray-800" : "bg-gray-900"} border border-gray-700 rounded-2xl p-4 flex justify-between items-center shadow-md hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold text-yellow-400 w-8 text-center">
                #{index + 1}
              </span>
              <span className="font-semibold text-white text-lg">
                {usr.username}
              </span>
            </div>
            <div className="text-green-400 font-mono text-md">
              {usr.rating} pts
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardPage;
