"use client";

import React, { useEffect, useState } from "react";

const LeaderboardPage = () => {
  const BACKEND_URI = process.env.BACKEND_URI || "http://localhost:5000/api";
  const [leaderboardData, setLeaderboardData] = useState([]);
  useEffect(() => {
    console.log();
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

    fetchLeaderboard();
  }, []);
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-10">Leaderboard</h1>
      <div className="max-w-3xl mx-auto space-y-4">
        {leaderboardData.map((user, index) => (
          <div
            key={user.username}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-4 flex justify-between items-center shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold text-yellow-400 w-8 text-center">
                #{index + 1}
              </span>
              <span className="font-semibold text-white text-lg">
                {user.username}
              </span>
            </div>
            <div className="text-green-400 font-mono text-md">
              {user.rating} pts
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardPage;
