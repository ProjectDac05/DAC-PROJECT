import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./components/common/Layout";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EventsListPage from "./pages/Events/EventsListPage";
import EventDetailsPage from "./pages/Events/EventDetailsPage";
import CheckoutPage from "./pages/Events/CheckoutPage";
import UserDashboard from "./pages/User/UserDashboard";
import MyBookings from "./pages/User/MyBookings";
import WishlistPage from "./pages/User/WishlistPage";
import CreatorDashboard from "./pages/Creator/CreatorDashboard";
import CreateEventPage from "./pages/Creator/CreateEventPage";
import MyEvents from "./pages/Creator/MyEvents";
import EventInsightPage from "./pages/Creator/EventInsightPage";
import EditEventPage from "./pages/Creator/EditEventPage";
import EventSeatSetupPage from "./pages/Creator/EventSeatSetupPage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import CreateUser from "./pages/Admin/CreateUser";
import Categories from "./pages/Admin/Categories";
import Reports from "./pages/Admin/Reports";
import Users from "./pages/Admin/Users";
import Events from "./pages/Admin/Events";
import Bookings from "./pages/Admin/Bookings";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Signup />} />
            <Route path="/events" element={<EventsListPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />

            {/* Protected routes */}
            <Route
              path="/checkout/:bookingId"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />

            {/* User routes */}
            <Route
              path="/user/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/wishlist"
              element={
                <ProtectedRoute>
                  <WishlistPage />
                </ProtectedRoute>
              }
            />

            {/* Creator routes */}
            <Route
              path="/creator/dashboard"
              element={
                <ProtectedRoute allowedRoles={["organizer"]}>
                  <CreatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/creator/events/create"
              element={
                <ProtectedRoute allowedRoles={["organizer"]}>
                  <CreateEventPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/creator/events"
              element={
                <ProtectedRoute allowedRoles={["organizer"]}>
                  <MyEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/creator/events/:id"
              element={
                <ProtectedRoute allowedRoles={["organizer"]}>
                  <EventInsightPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/creator/events/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["organizer"]}>
                  <EditEventPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/creator/events/:id/seats"
              element={
                <ProtectedRoute allowedRoles={["organizer"]}>
                  <EventSeatSetupPage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users/create"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <CreateUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Categories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Events />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Bookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* 404 Not Found */}
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}
