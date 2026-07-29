"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import TerminalHeader from "@/components/ui/TerminalHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

const Register = () => {
  const router = useRouter();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [details, setDetails] = useState({ username: "", password: "" });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/user/register",
        details,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (res.status === 200 || res.status === 201) {
        toast.success("Registration successful");
        router.replace("/login");
      } else {
        toast.error(res.data.error || "Registration failed");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error || "Registration failed");
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const handleChange = (e) => {
    setDetails((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

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
              Register your account
            </p>
          </div>

          <div className="bg-surface-1 border border-[var(--border-default)] rounded-lg p-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                id="username"
                label="Username"
                type="text"
                value={details.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
              />

              <Input
                id="password"
                label="Password"
                type="password"
                value={details.password}
                onChange={handleChange}
                placeholder="Choose a password"
                required
              />

              <Button type="submit" variant="primary" size="md" className="w-full">
                Register
              </Button>
            </form>

            <p className="mt-5 text-center text-[12px] text-zinc-500">
              Already have an account?{" "}
              <Link href="/login" className="text-accent hover:text-accent-light transition-colors">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;