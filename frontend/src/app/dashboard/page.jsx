"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoadingScreen from "@/components/LoadingPage/LoadingPage";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

const UserDashboard = () => {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const [details, setDetails] = useState(null);
  const router = useRouter();

  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.id) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/user/${user.id}`
        );
        if (res.status === 200) {
          setDetails(res.data.user);
        } else {
          toast.error("Could not fetch user details, try logging in again!");
        }
      } catch (error) {
        toast.error("Failed to fetch user details.");
        console.error(error);
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
          <li>🟢 You won against `opponent1`</li>
          <li>🔴 You lost to `opponent2`</li>
          <li>🟢 You won against `opponent3`</li>
        </ul>
      </div>

      <button onClick={() => logout()} className="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-2 rounded-xl font-semibold text-black hover:opacity-90 transition-all duration-200 cursor-pointer">
        Logout
      </button>
    </div>
  );
};

export default UserDashboard;
