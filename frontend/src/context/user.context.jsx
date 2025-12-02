// src/context/user.context.jsx
import React, { createContext, useState, useEffect } from "react";
import axios from "../config/axios";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load user from localStorage first
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Fetch user from API to ensure fresh data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/auth/me");
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  // Update user profile (avatar, theme, etc.)
  const updateProfile = async ({ avatar, theme }) => {
    try {
      const res = await axios.put("/users/profile", { avatar, theme });
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      return res.data.user;
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
};
