import { useAuth } from "../../context/useAuth";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format, parse } from "date-fns";
import api from "../../services/api";

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    totalBookings: 0,
    wishlistCount: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/users/stats");
        setStats(response.data.data.stats);
        setUpcomingEvents(response.data.data.upcomingEvents || []);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">User Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Welcome back, {user?.name}
        </h2>
        <p className="text-gray-600 mb-6">
          Here's what's happening with your event bookings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/user/bookings" className="block">
            <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors">
              <h3 className="font-medium text-blue-800">Upcoming Events</h3>
              <p className="text-2xl font-bold mt-2">{stats.upcomingEvents}</p>
            </div>
          </Link>
          <Link to="/user/bookings" className="block">
            <div className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors">
              <h3 className="font-medium text-green-800">Total Bookings</h3>
              <p className="text-2xl font-bold mt-2">{stats.totalBookings}</p>
            </div>
          </Link>
          <Link to="/user/wishlist" className="block">
            <div className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors">
              <h3 className="font-medium text-purple-800">Wishlist</h3>
              <p className="text-2xl font-bold mt-2">{stats.wishlistCount}</p>
            </div>
          </Link>
        </div>

        {/* Upcoming Events Section */}
        {upcomingEvents.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Your Upcoming Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => {
                let formattedDate = "Invalid Date";
                let formattedTime = "Invalid Time";

                if (event.date && event.time) {
                  const eventDate = parse(
                    `${event.date} ${event.time}`,
                    "yyyy-MM-dd HH:mm:ss",
                    new Date()
                  );
                  if (!isNaN(eventDate)) {
                    formattedDate = format(eventDate, "EEE, MMM d, yyyy");
                    formattedTime = format(eventDate, "h:mm a");
                  }
                }

                return (
                  <Link
                    key={event.booking_id}
                    to={`/events/${event.event_id}`}
                    className="block bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="relative h-32 mb-3">
                      <img
                        src={event.image_url || "/images/event-placeholder.jpg"}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover rounded"
                      />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      {event.title}
                    </h4>
                    <p className="text-sm text-gray-600">{formattedDate}</p>
                    <p className="text-sm text-gray-600">{formattedTime}</p>
                    <p className="text-sm text-gray-600">{event.location}</p>
                    <div className="mt-2 text-sm">
                      <span className="text-indigo-600 font-medium">
                        Seats: {event.booked_seats.join(", ")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
