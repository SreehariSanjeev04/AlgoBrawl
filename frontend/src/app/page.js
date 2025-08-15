"use client"
import React, { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import socket from "./socket/socket";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const handleRedirect = () => {
    if(!loading) {
      if(isAuthenticated && user?.id) {
        router.push("/waiting");
      } else {
        router.push("/login");
      }
    }
    return;
  }

  useEffect(() => {
    socket.connect();
    const handleConnect = () => {
      console.log("Connected to socket server");
      if(!loading && isAuthenticated && user?.id) {
        socket.emit("online", user);
      } 
    }
    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.disconnect();
    };
  }, [isAuthenticated, loading, user?.id]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans">
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">AlgoBrawl</h1>
        <nav className="space-x-6 text-gray-300 text-sm">
          {!loading && !isAuthenticated ? <Link href="/login" className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 text-white font-semibold rounded-full hover:opacity-90">Login</Link> : <button onClick={() => logout()} className="bg-gradient-to-r from-red-600 to-orange-600 px-5 py-2 text-white font-semibold rounded-full hover:opacity-90">Logout</button>}
        </nav>
      </header>

      <section className="text-center py-24 px-6">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
          Code. Compete. Conquer.
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-10">
          Match up with coders worldwide in real-time. Solve the same challenge. First to finish wins.
        </p>
        <button onClick={() => handleRedirect()} className="inline-block bg-gradient-to-r from-green-500 to-teal-500 px-8 py-3 rounded-xl font-semibold text-black hover:opacity-90 transition-all duration-200">
          Start a Match
        </button>
      </section>

      <section id="features" className="py-16 px-6 bg-[#111111] border-t border-gray-800">
        <div className="max-w-4xl mx-auto grid gap-10 md:grid-cols-3 text-center">
          <div>
            <h3 className="text-xl font-bold mb-2">🔥 Live Duels</h3>
            <p className="text-gray-400">Instant matchmaking with players near your skill level.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">⚔️ Same Problem, Same Time</h3>
            <p className="text-gray-400">Face off on the exact same challenge and win by speed + skill.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">🏆 Rankings & Replays</h3>
            <p className="text-gray-400">Track your progress and watch replays of your matches.</p>
          </div>
        </div>
      </section>


      <footer className="py-6 px-6 border-t border-gray-800 text-center text-sm text-gray-500">
        © 2025 AlgoBrawl. Built for coders, by coders.
      </footer>
    </div>
  );
}
