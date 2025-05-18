import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import ManageUsers from "./ManageUsers";
import ManageEvents from "./ManageEvents";
import ManageBookings from "./ManageBookings";
import { useAuth } from "../../context/useAuth";

export default function AdminRoutes() {
  const { user } = useAuth();

  // Check if user is admin
  if (!user || user.role !== "admin") {
    return <Navigate to="/login" />;
  }

  return (
    <Routes>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="users" element={<ManageUsers />} />
      <Route path="events" element={<ManageEvents />} />
      <Route path="bookings" element={<ManageBookings />} />
      <Route path="" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
