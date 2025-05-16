import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/useAuth";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    users_count: 0,
    events_count: 0,
    bookings_count: 0,
    revenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/admin/stats");
        setStats(response.data.stats);
        setRecentBookings(response.data.recent_bookings);
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
            <p className="text-3xl font-bold mt-2">{stats.users_count}</p>
            <Link
              to="/admin/users"
              className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
            >
              Manage Users →
            </Link>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="font-medium text-green-800">Total Events</h3>
            <p className="text-3xl font-bold mt-2">{stats.events_count}</p>
            <Link
              to="/admin/events"
              className="text-green-600 hover:text-green-800 text-sm mt-2 inline-block"
            >
              View All Events →
            </Link>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="font-medium text-purple-800">Total Bookings</h3>
            <p className="text-3xl font-bold mt-2">{stats.bookings_count}</p>
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
              {(stats.revenue || 0).toLocaleString("en-IN", {
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
                    Amount
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{booking.total_amount}
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
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/users/create"
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h4 className="font-medium text-gray-900">Create New User</h4>
              <p className="text-sm text-gray-600 mt-1">
                Add a new user or organizer to the platform
              </p>
            </Link>

            <Link
              to="/admin/categories"
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h4 className="font-medium text-gray-900">Manage Categories</h4>
              <p className="text-sm text-gray-600 mt-1">
                Add or edit event categories
              </p>
            </Link>

            <Link
              to="/admin/reports"
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h4 className="font-medium text-gray-900">View Reports</h4>
              <p className="text-sm text-gray-600 mt-1">
                Access detailed platform analytics
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
