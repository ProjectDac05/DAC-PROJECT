import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get("/admin/bookings");
      setBookings(response.data.data.bookings);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    // Add confirmation dialog for cancellation
    if (newStatus === "cancelled") {
      if (!window.confirm("Are you sure you want to cancel this booking?")) {
        return;
      }
    }

    try {
      await api.patch(`/admin/bookings/${bookingId}/status`, {
        status: newStatus,
      });
      toast.success("Booking status updated successfully!");
      fetchBookings();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to update booking status";
      toast.error(errorMessage);
    }
  };

  // Filter bookings based on showCancelled state
  const filteredBookings = bookings.filter(
    (booking) => showCancelled || booking.status !== "cancelled"
  );

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
        <h1 className="text-3xl font-bold text-gray-900">Manage Bookings</h1>
        <div className="flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
              className="form-checkbox h-5 w-5 text-indigo-600"
            />
            <span className="ml-2 text-gray-700">Show Cancelled Bookings</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booking ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <tr key={booking.booking_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    #{booking.booking_id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {booking.event_title}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {booking.user_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {booking.user_email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    ₹{booking.total_amount}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      booking.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : booking.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {booking.status.charAt(0).toUpperCase() +
                      booking.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(booking.booking_date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(booking.booking_date).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {booking.status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          handleStatusChange(booking.booking_id, "confirmed")
                        }
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(booking.booking_id, "cancelled")
                        }
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {booking.status === "confirmed" && (
                    <button
                      onClick={() =>
                        handleStatusChange(booking.booking_id, "cancelled")
                      }
                      className="text-red-600 hover:text-red-900"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
