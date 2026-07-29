"use client";

import React from "react";

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-surface-1 border border-[var(--border-default)] flex items-center justify-center">
          <div className="w-5 h-5 border border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-[12px] font-mono text-zinc-100 font-medium">
            algobrawl
          </p>
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
            Initializing...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;