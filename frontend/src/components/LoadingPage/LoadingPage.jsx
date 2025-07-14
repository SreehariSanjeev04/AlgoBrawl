"use client";

import React from "react";
import { MoonLoader } from "react-spinners"; 

const LoadingScreen = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="flex flex-col items-center gap-6 animate-fadeIn">
        <MoonLoader color="#a855f7" size={60} />
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
          Loading AlgoBrawl...
        </h1>
        <p className="text-sm text-gray-400">Preparing your battle arena...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
