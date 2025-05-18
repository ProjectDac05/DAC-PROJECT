// import { useAuth } from "../context/authContext";
import { useAuth } from "../context/useAuth";
import { Navigate, useLocation, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user's role is not allowed, redirect to their appropriate dashboard
    const dashboardPath =
      user.role === "admin"
        ? "/admin/dashboard"
        : user.role === "organizer"
        ? "/creator/dashboard"
        : "/user/dashboard";
    return <Navigate to={dashboardPath} replace />;
  }

  return <Outlet />;
}
