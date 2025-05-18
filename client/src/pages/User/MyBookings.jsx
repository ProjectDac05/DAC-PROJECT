import { useState, useEffect } from "react";
import api from "../../services/api";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/bookings/user/bookings");

      if (response.data?.data?.bookings) {
        // Only show active (non-cancelled) bookings
        const activeBookings = response.data.data.bookings.filter(
          (booking) => booking.status !== "cancelled"
        );
        setBookings(activeBookings);
      } else {
        setError("Failed to load bookings data");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load your bookings. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    try {
      setCancellingBookingId(bookingId);
      const booking = bookings.find((b) => b.booking_id === bookingId);

      if (!booking) {
        toast.error("Booking not found");
        return;
      }

      if (booking.status !== "confirmed") {
        toast.error("Only confirmed bookings can be cancelled");
        return;
      }

      await api.patch(`/bookings/${bookingId}/cancel`);

      // Fetch fresh data after cancellation
      await fetchBookings();

      toast.success("Booking cancelled successfully");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to cancel booking. Please try again later."
      );
    } finally {
      setCancellingBookingId(null);
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
      </div>

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
                    {booking.event_title}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {format(new Date(booking.event_date), "EEEE, MMMM d, yyyy")}{" "}
                    at {booking.event_time}
                  </p>
                  <p className="text-gray-600 mt-1">
                    Location: {booking.event_location}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    ₹{booking.total_amount}
                  </p>
                  {booking.status === "confirmed" && (
                    <button
                      onClick={() => handleCancelBooking(booking.booking_id)}
                      disabled={cancellingBookingId === booking.booking_id}
                      className={`mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                        cancellingBookingId === booking.booking_id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {cancellingBookingId === booking.booking_id ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Cancelling...
                        </>
                      ) : (
                        "Cancel Booking"
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Booked Seats
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {booking.seats?.map((seat) => (
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
