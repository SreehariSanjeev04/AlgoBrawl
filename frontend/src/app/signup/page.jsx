"use client"

import React, { useState } from "react";

const Register = () => {
  const [details, setDetails] = useState({
    username: "",
    password: "",
  });

  const handleRegister = async (e) => {
    console.log(details)
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/user/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(details),
      credentials: "include",
    });

    const data = await res.json();
    if (res.ok) {
      redirect("/login");
    } else {
      alert(data.error);
    }
  };

  const handleChange = (e) => {
    setDetails(prev => ({
      ...prev,
      [e.target.id]:e.target.value
    }))
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="bg-gray-900 bg-opacity-80 backdrop-blur-lg rounded-xl shadow-xl p-10 max-w-md w-full border border-gray-700">
        <h1 className="text-5xl py-5 font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mb-8 text-center">
          AlgoBrawl
        </h1>

        <h2 className="text-xl font-semibold text-gray-300 mb-6 text-center">
          Register your account
        </h2>

        <form className="space-y-6" onSubmit={handleRegister}>
          <div>
            <label
              htmlFor="username"
              className="block text-gray-400 font-semibold mb-2"
            >
              Email Address
            </label>
            <input
              id="username"
              type="email"
              required
              value={details.username}
              onChange={handleChange}
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
              required
              value={details.password}
              onChange={handleChange}
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
          Already have an account?{" "}
          <a
            href="/login"
            className="text-pink-500 font-semibold hover:underline"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
