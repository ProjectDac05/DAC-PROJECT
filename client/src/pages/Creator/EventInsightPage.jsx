import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../services/api";

export default function EventInsightPage() {
  const { id } = useParams();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await api.get(`/creator/events/${id}/insights`);
        setEventData(response.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch event insights"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600 p-4">{error}</div>;
  if (!eventData) return <div>Event not found</div>;

  const { event, stats, recentBookings } = eventData;

  // Ensure stats has default values
  const safeStats = {
    bookings: stats?.bookings || 0,
    revenue: stats?.revenue || 0,
    seatsBooked: stats?.seatsBooked || 0,
    availableSeats: stats?.availableSeats || 0,
  };

  // Calculate occupancy rate safely
  const totalSeats = safeStats.seatsBooked + safeStats.availableSeats;
  const occupancyRate =
    totalSeats > 0 ? (safeStats.seatsBooked / totalSeats) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Event Insights: {event?.title || "Untitled Event"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Booking Statistics</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">
                Total Bookings: {safeStats.bookings}
              </p>
              <p className="text-gray-600">
                Seats Booked: {safeStats.seatsBooked}
              </p>
              <p className="text-gray-600">
                Available Seats: {safeStats.availableSeats}
              </p>
            </div>
            <div className="h-4 bg-gray-200 rounded-full">
              <div
                className="h-4 bg-indigo-600 rounded-full"
                style={{
                  width: `${occupancyRate}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Revenue</h2>
          <p className="text-2xl font-bold text-green-600">
            ₹{Number(safeStats.revenue).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Occupancy Rate</h2>
          <p className="text-2xl font-bold text-indigo-600">
            {occupancyRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {recentBookings && recentBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBookings.map((booking) => (
                  <tr key={booking.booking_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{booking.booking_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.user_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(booking.booking_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{Number(booking.total_amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
