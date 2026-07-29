"use client";

import Link from "next/link";
import StatusDot from "./StatusDot";
import Button from "./Button";

export default function TerminalHeader({
  user,
  isAuthenticated,
  loading,
  onLogout,
  isConnected,
}) {
  return (
    <header className="sticky top-0 z-50 bg-[#08090a]/80 backdrop-blur-md border-b border-[var(--border-default)]">
      <div className="flex items-center justify-between h-11 px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[13px] font-mono font-semibold tracking-tight text-zinc-100">
              algobrawl
            </span>
            <span className="text-[10px] font-mono text-zinc-600">~</span>
          </Link>

          {isConnected !== undefined && (
            <div className="flex items-center gap-1.5">
              <StatusDot status={isConnected ? "online" : "offline"} />
              <span className="text-[10px] font-mono text-zinc-500">
                {isConnected ? "connected" : "disconnected"}
              </span>
            </div>
          )}
        </div>

        <nav className="flex items-center gap-2">
          {!loading && isAuthenticated && (
            <>
              <Link
                href="/dashboard"
                className="text-[12px] text-zinc-400 hover:text-zinc-200 transition-colors duration-150 px-2 py-1"
              >
                dashboard
              </Link>
              <Link
                href="/leaderboard"
                className="text-[12px] text-zinc-400 hover:text-zinc-200 transition-colors duration-150 px-2 py-1"
              >
                leaderboard
              </Link>
              <span className="w-px h-4 bg-[var(--border-default)] mx-1" />
              <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                {user?.username}
              </span>
            </>
          )}

          {!loading && isAuthenticated ? (
            onLogout && (
              <Button variant="ghost" size="xs" onClick={onLogout}>
                logout
              </Button>
            )
          ) : !loading ? (
            <Link href="/login">
              <Button variant="secondary" size="xs">
                login
              </Button>
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}