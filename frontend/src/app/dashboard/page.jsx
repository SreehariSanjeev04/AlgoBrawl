"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoadingScreen from "@/components/LoadingPage/LoadingPage";
import { redirect, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

const UserDashboard = () => {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const [details, setDetails] = useState(null);
  const [matches, setMatches] = useState([]);
  const router = useRouter();

  const [shouldRender, setShouldRender] = useState(false);

  const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URI;
  console.log("Backend URI:", BACKEND_URI);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.id || !isAuthenticated) return;
      try {
        const [userRes, matchRes] = await Promise.all([
          axios.get(`${BACKEND_URI}/user/${user.id}`),
          axios.post(
            `${BACKEND_URI}/user/get-matches`,
            {
              user_id: user.id,
            },
            {
              withCredentials: true,
            }
          ),
        ]);

        console.log("Match history fetched:", matchRes.data.matches);
        console.log("User details fetched:", userRes.data.user);

        if (userRes.status === 200) {
          setDetails(userRes.data.user);
        } else {
          toast.error("Failed to fetch user details.");
          logout();
          redirect("/login");
        }

        if (matchRes.status === 200) {
          setMatches(matchRes.data.matches);
        } else {
          toast.error("Failed to fetch match history.");
          logout();
          redirect("/login");
        }
      } catch (error) {
        toast.error("Session expired or data fetch failed.");
        console.error(error);
        logout();
        redirect("/login");
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
    <div className="min-h-screen bg-gray-900 text-white px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">
        Welcome, <span className="text-green-400">{user?.username}</span>
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-gray-400 text-sm">Rating</h2>
          <p className="text-2xl font-bold text-green-400">{details?.rating}</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-gray-400 text-sm">Matches Played</h2>
          <p className="text-2xl font-bold">{details?.matches_played}</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-gray-400 text-sm">Wins</h2>
          <p className="text-2xl font-bold">{details?.wins}</p>
        </div>
      </div>
      <div className="bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Matches</h2>
        <ul className="space-y-2 text-gray-300 text-sm">
          {matches.length !== 0 ? (
            matches.map((match, index) => {
              const player1username =
                match.player1_id === user.id
                  ? match.Player1.username
                  : match.Player2.username;
              const player2_username =
                match.player1_id === user.id
                  ? match.Player2.username
                  : match.Player1.username;
              return match.winner === user.id ? (
                <li key={index}>🟢 You won against {player2_username}</li>
              ) : match.winner === null || match.winner === -1 ? (
                <li key={index}>🟡 Match against {player2_username} was a draw</li>
              ) : (
                <li key={index}>🔴 You lost to {player2_username}</li>
              );
            })
          ) : (
            <p>No matches played yet.</p>
          )}
        </ul>
      </div>
      <button
        onClick={() => logout()}
        className="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-2 rounded-xl font-semibold text-black hover:opacity-90 transition-all duration-200 cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
};

export default UserDashboard;
