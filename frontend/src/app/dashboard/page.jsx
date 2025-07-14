"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoadingScreen from "@/components/LoadingPage/LoadingPage";
import { useRouter } from "next/navigation";

const UserDashboard = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else {
        setShouldRender(true);
      }
    }
  }, [loading, isAuthenticated]);

  if (loading || !shouldRender) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">
        Welcome, <span className="text-green-400">{user?.username}</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-gray-400 text-sm">Rating</h2>
          <p className="text-2xl font-bold text-green-400">{user?.rating}</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-gray-400 text-sm">Matches Played</h2>
          <p className="text-2xl font-bold">{user?.matches_played}</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-gray-400 text-sm">Wins</h2>
          <p className="text-2xl font-bold">{user?.wins}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Matches</h2>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>🟢 You won against `opponent1`</li>
          <li>🔴 You lost to `opponent2`</li>
          <li>🟢 You won against `opponent3`</li>
        </ul>
      </div>

      <button className="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-2 rounded-xl font-semibold text-black hover:opacity-90 transition-all duration-200">
        Logout
      </button>
    </div>
  );
};

export default UserDashboard;
