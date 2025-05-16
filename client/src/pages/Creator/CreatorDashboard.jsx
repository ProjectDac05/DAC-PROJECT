import { useAuth } from "../../context/useAuth";
import { useState, useEffect } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/creator/stats");
        setStats(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
        <Link
          to="/creator/events/create"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Create New Event
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user?.name}</h2>
        <p className="text-gray-600 mb-8">
          Manage your events and view insights about your bookings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-50 p-6 rounded-lg">
            <h3 className="font-medium text-indigo-800">Total Events</h3>
            <p className="text-3xl font-bold mt-2">{stats.totalEvents}</p>
            <Link
              to="/creator/events"
              className="text-indigo-600 hover:text-indigo-800 text-sm mt-2 inline-block"
            >
              View All Events →
            </Link>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="font-medium text-green-800">Total Bookings</h3>
            <p className="text-3xl font-bold mt-2">{stats.totalBookings}</p>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="font-medium text-yellow-800">Total Revenue</h3>
            <p className="text-3xl font-bold mt-2">
              ₹
              {stats.totalRevenue.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {stats.recentEvents && stats.recentEvents.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recentEvents.map((event) => (
                <Link
                  key={event.event_id}
                  to={`/creator/events/${event.event_id}`}
                  className="block bg-gray-50 p-4 rounded-lg hover:bg-gray-100"
                >
                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">
                      {event.booked_seats}/{event.total_seats} seats booked
                    </span>
                    <span className="text-sm font-medium text-indigo-600">
                      View Details →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
