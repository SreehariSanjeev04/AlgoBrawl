"use client";
import { redirect } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/LoadingPage/LoadingPage";

const Login = () => {
  const [details, setDetails] = useState({
    username: "",
    password: "",
  });

  const { user, login, logout, isAuthenticated, loading } = useAuth();

  const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URI;

  const router = useRouter();
  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await axios.post(`${BACKEND_URI}/user/login`, details, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: true,
    });

    const data = res.data;
    if (res.status !== 200) {
      toast.error("Login failed");
    } else {
      toast.success("Login successful");
      router.replace("/");
      login(data.user, data.accessToken);
    }
  };
  const handleChange = (e) => {
    setDetails((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/");
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="bg-gray-900 bg-opacity-80 backdrop-blur-lg rounded-xl shadow-xl p-10 max-w-md w-full border border-gray-700">
        <h1 className="text-5xl py-5 font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mb-8 text-center">
          AlgoBrawl
        </h1>

        <h2 className="text-xl font-semibold text-gray-300 mb-6 text-center">
          Log in to your account
        </h2>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label
              htmlFor="username"
              className="block text-gray-400 font-semibold mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={details.username}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-md bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-gray-400 font-semibold mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={details.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-md bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-600 via-purple-700 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 text-white font-bold py-3 rounded-md shadow-lg transition"
          >
            Log In
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500">
          Don’t have an account?{" "}
          <a
            href="/signup"
            className="text-pink-500 font-semibold hover:underline"
          >
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
