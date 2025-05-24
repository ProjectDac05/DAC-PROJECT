import { useContext } from "react";
import { AuthContext } from "./authContext";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  console.log("Current auth context:", {
    user: context.user,
    loading: context.loading,
    isAuthenticated: context.isAuthenticated,
  });
  return context;
}
