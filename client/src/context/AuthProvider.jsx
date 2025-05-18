import { useState, useEffect } from "react";
import { AuthContext } from "./authContext";
import api from "../services/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");

        if (token && storedUser) {
          // Set the token in axios defaults
          api.defaults.headers.common.Authorization = `Bearer ${token}`;

          // Try to get user data from API
          const response = await api.get("/auth/me");
          if (response.data?.data?.user) {
            setUser(response.data.data.user);
          } else {
            // If no user data, use stored user data
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        // If API call fails but we have stored user data, use it
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // Clear invalid tokens
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          api.defaults.headers.common.Authorization = "";
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (token, userData) => {
    try {
      // Store token
      localStorage.setItem("accessToken", token);

      // Set the token in axios defaults
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Set user state
      const userState = {
        id: userData.user_id,
        name: userData.name,
        role: userData.role,
        email: userData.email,
      };
      setUser(userState);
      localStorage.setItem("user", JSON.stringify(userState));
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
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

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
