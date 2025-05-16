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
import CreatorDashboard from "./pages/Creator/CreatorDashboard";
import CreateEventPage from "./pages/Creator/CreateEventPage";
import MyEvents from "./pages/Creator/MyEvents";
import EventInsightPage from "./pages/Creator/EventInsightPage";
import EditEventPage from "./pages/Creator/EditEventPage";
import EventSeatSetupPage from "./pages/Creator/EventSeatSetupPage";
import AdminDashboard from "./pages/Admin/AdminDashboard";

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

            {/* Protected user routes */}
            <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
              <Route path="/checkout/:bookingId" element={<CheckoutPage />} />
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/user/bookings" element={<MyBookings />} />
            </Route>

            {/* Protected creator routes */}
            <Route element={<ProtectedRoute allowedRoles={["organizer"]} />}>
              <Route path="/creator/dashboard" element={<CreatorDashboard />} />
              <Route
                path="/creator/events/create"
                element={<CreateEventPage />}
              />
              <Route path="/creator/events" element={<MyEvents />} />
              <Route
                path="/creator/events/:id"
                element={<EventInsightPage />}
              />
              <Route
                path="/creator/events/:id/edit"
                element={<EditEventPage />}
              />
              <Route
                path="/creator/events/:id/seats"
                element={<EventSeatSetupPage />}
              />
            </Route>

            {/* Protected admin routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>

            {/* 404 Not Found */}
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}
