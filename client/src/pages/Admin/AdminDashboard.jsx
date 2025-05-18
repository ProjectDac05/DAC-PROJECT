import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/useAuth";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    usersCount: 0,
    eventsCount: 0,
    bookingsCount: 0,
    totalRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/admin/dashboard");
        const { stats, recentBookings, upcomingEvents } = response.data.data;
        setStats(stats);
        setRecentBookings(recentBookings);
        setUpcomingEvents(upcomingEvents);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user?.name}</h2>
        <p className="text-gray-600 mb-8">
          Here's an overview of your event booking platform.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="font-medium text-blue-800">Total Users</h3>
            <p className="text-3xl font-bold mt-2">{stats.usersCount}</p>
            <Link
              to="/admin/users"
              className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
            >
              Manage Users →
            </Link>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="font-medium text-green-800">Total Events</h3>
            <p className="text-3xl font-bold mt-2">{stats.eventsCount}</p>
            <Link
              to="/admin/events"
              className="text-green-600 hover:text-green-800 text-sm mt-2 inline-block"
            >
              View All Events →
            </Link>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="font-medium text-purple-800">Total Bookings</h3>
            <p className="text-3xl font-bold mt-2">{stats.bookingsCount}</p>
            <Link
              to="/admin/bookings"
              className="text-purple-600 hover:text-purple-800 text-sm mt-2 inline-block"
            >
              View Bookings →
            </Link>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="font-medium text-yellow-800">Total Revenue</h3>
            <p className="text-3xl font-bold mt-2">
              ₹
              {(stats.totalRevenue || 0).toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentBookings.map((booking) => (
                  <tr key={booking.booking_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{booking.booking_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.user_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.event_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(booking.booking_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <div
                key={event.event_id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <h4 className="font-medium text-gray-900">{event.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(event.start_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">{event.venue}</p>
                <span
                  className={`mt-2 inline-block px-2 py-1 rounded text-xs font-medium ${
                    event.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/users"
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h4 className="font-medium text-gray-900">Manage Users</h4>
              <p className="text-sm text-gray-600 mt-1">
                View and manage platform users
              </p>
            </Link>

            <Link
              to="/admin/events"
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h4 className="font-medium text-gray-900">Manage Events</h4>
              <p className="text-sm text-gray-600 mt-1">
                Review and moderate events
              </p>
            </Link>

            <Link
              to="/admin/bookings"
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h4 className="font-medium text-gray-900">View Bookings</h4>
              <p className="text-sm text-gray-600 mt-1">
                Monitor all event bookings
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
