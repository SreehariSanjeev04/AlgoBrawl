"use client";

import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const login = (userData, accessToken) => {
    console.log("Login in AuthProvider")
    console.log(userData)
    console.log(accessToken)
    setUser(userData);
    setIsAuthenticated(true);
    if (accessToken) {
      localStorage.setItem("access-token", accessToken);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("access-token");
    localStorage.removeItem("refresh-token");
  };

  useEffect(() => {
    console.log("Running AuthProvider")
    const authenticate = async () => {
      setLoading(true);
      try {
        const accessToken = localStorage.getItem("access-token");
        if (!accessToken) {
          logout();
        }

        const response = await axios.post(
          "http://localhost:5000/api/user/validate",
          null,
          {
            headers: {
              "authorization": `Bearer ${accessToken}`,
            },
            withCredentials: true,
          }
        );

        if (response.status === 200) {
          setUser(response.data);
          setIsAuthenticated(true);
          return;
        }
      } catch (err) {
        try {
          const refresh = await axios.post(
            "http://localhost:5000/api/user/refresh-token",
            null,
            {
              headers: {
                "authorization": `Bearer ${accessToken}`,
              },
              withCredentials: true
            }
          );

          if (refresh.status === 200) {
            setUser(refresh.data.user);
            setIsAuthenticated(true);
            localStorage.setItem("access-token", refresh.data.accessToken);
          } else {
            logout();
          }
        } catch (err2) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    authenticate();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
