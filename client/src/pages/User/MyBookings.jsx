import { useState, useEffect } from "react";
import api from "../../services/api";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      console.log("Fetching bookings...");
      setLoading(true);
      const response = await api.get("/bookings/user");
      console.log("Bookings response:", response.data);
      setBookings(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load your bookings. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      // Find the booking in the current bookings list
      const booking = bookings.find((b) => b.booking_id === bookingId);

      // Check if booking exists and is not already cancelled
      if (!booking) {
        setError("Booking not found");
        return;
      }

      if (booking.status === "cancelled") {
        setError("This booking is already cancelled");
        return;
      }

      await api.patch(`/bookings/${bookingId}/cancel`);
      // Refresh bookings after cancellation
      fetchBookings();
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setError(
        err.response?.data?.message ||
          "Failed to cancel booking. Please try again later."
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600">You haven't made any bookings yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <div
              key={booking.booking_id}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {booking.event.title}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {new Date(booking.event.date).toLocaleDateString()} at{" "}
                    {booking.event.time}
                  </p>
                  <p className="text-gray-600 mt-1">
                    Location: {booking.event.location}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : booking.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    ₹{booking.total_amount}
                  </p>
                  {booking.status === "confirmed" ? (
                    <button
                      onClick={() => handleCancelBooking(booking.booking_id)}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      {" "}
                      Cancel Booking{" "}
                    </button>
                  ) : booking.status === "cancelled" ? (
                    <span className="mt-2 text-sm text-gray-500">
                      Cancelled
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Booked Seats
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {booking.seats.map((seat) => (
                    <span
                      key={seat.seat_id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {seat.seat_number}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
