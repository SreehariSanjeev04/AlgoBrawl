"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/LoadingPage/LoadingPage";
import TerminalHeader from "@/components/ui/TerminalHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const Login = () => {
  const [details, setDetails] = useState({ username: "", password: "" });
  const { user, login, logout, isAuthenticated, loading } = useAuth();
  const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URI;
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BACKEND_URI}/user/login`, details, {
        withCredentials: true,
      });
      toast.success("Login successful");
      router.replace("/");
      login(res.data.user, res.data.accessToken);
    } catch (err) {
      toast.error("Login failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handleChange = (e) => {
    setDetails((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/");
    }
  }, [loading, isAuthenticated]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#08090a]">
      <TerminalHeader
        user={user}
        isAuthenticated={isAuthenticated}
        loading={loading}
        onLogout={logout}
      />

      <div className="relative min-h-[calc(100vh-44px)] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-grid pointer-events-none" />

        <div className="relative w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-[22px] font-mono font-bold tracking-tight text-zinc-100 mb-1">
              algobrawl
            </h1>
            <p className="text-[12px] font-mono text-zinc-500">
              Log in to your account
            </p>
          </div>

          <div className="bg-surface-1 border border-[var(--border-default)] rounded-lg p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                id="username"
                label="Username"
                type="text"
                value={details.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
              />

              <Input
                id="password"
                label="Password"
                type="password"
                value={details.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />

              <Button type="submit" variant="primary" size="md" className="w-full">
                Log In
              </Button>
            </form>

            <p className="mt-5 text-center text-[12px] text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-accent hover:text-accent-light transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;