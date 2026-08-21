import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("fakesense_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("fakesense_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await api.auth.getMe();
          setUser(userData);
          localStorage.setItem("fakesense_user", JSON.stringify(userData));
        } catch {
          // Token expired or invalid
          logout();
        }
      }
      setLoading(false);
    };

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("auth_unauthorized", handleUnauthorized);
    initAuth();

    return () => {
      window.removeEventListener("auth_unauthorized", handleUnauthorized);
    };
  }, [token]);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem("fakesense_token", res.access_token);
    localStorage.setItem("fakesense_user", JSON.stringify(res.user));
    return res;
  };

  const register = async (email, password) => {
    const res = await api.auth.register(email, password);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem("fakesense_token", res.access_token);
    localStorage.setItem("fakesense_user", JSON.stringify(res.user));
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("fakesense_token");
    localStorage.removeItem("fakesense_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
