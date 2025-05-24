import { useState, useEffect } from "react";
import { AuthContext } from "./authContext";
import api from "../services/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");

      console.log("Auth state:", {
        hasToken: !!token,
        hasStoredUser: !!storedUser,
        storedUser: storedUser ? JSON.parse(storedUser) : null,
      });

      if (!token || !storedUser) {
        console.log("No token or stored user found");
        // Clear any potentially invalid data
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setUser(null);
        setLoading(false);
        return;
      }

      // Set the token in axios defaults
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Try to get user data from API
      const response = await api.get("/auth/me");
      console.log("Auth check response:", response.data);

      if (response.data && response.data.data && response.data.data.user) {
        console.log("Setting user:", response.data.data.user);
        setUser(response.data.data.user);
      } else {
        console.log("Invalid user data in response");
        // Clear invalid data
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to load user:", error);
      // Clear invalid tokens
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      api.defaults.headers.common.Authorization = "";
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (token, userData) => {
    try {
      if (!token) {
        throw new Error("No access token provided");
      }

      // Validate required user data fields
      if (!userData || !userData.userId || !userData.role) {
        console.error("Invalid user data received:", userData);
        throw new Error("Invalid user data format");
      }

      // Create a properly structured user object
      const userObject = {
        user_id: userData.userId,
        name: userData.name || "User",
        role: userData.role,
        email: userData.email,
      };

      // Store token and user data
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(userObject));

      // Set the token in axios defaults
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Set user state
      setUser(userObject);

      return userObject;
    } catch (error) {
      console.error("Login error:", error);
      // Clean up on login failure
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      api.defaults.headers.common.Authorization = "";
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        await api.post("/auth/logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear storage and state
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      api.defaults.headers.common.Authorization = "";
      setUser(null);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.post("/auth/refresh-token");
      const { accessToken, user: userData } = response.data;

      if (!accessToken || !userData) {
        throw new Error("Invalid refresh token response");
      }

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      setUser(userData);

      return accessToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
