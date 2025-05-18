import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

export default function CheckoutPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingBooking, setConfirmingBooking] = useState(false);

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!bookingId) {
        setError("No booking ID provided");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching data for booking:", bookingId);
        setLoading(true);
        setError("");

        const response = await api.get(`/bookings/${bookingId}`);
        console.log("Full API Response:", response);
        console.log(
          "Booking data structure:",
          JSON.stringify(response.data, null, 2)
        );

        if (!response.data?.data?.booking) {
          throw new Error("Invalid booking data received from server");
        }

        setBooking(response.data.data.booking);
      } catch (error) {
        console.error("Error fetching booking data:", error);
        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load booking details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [bookingId]);

  const handleConfirmBooking = async () => {
    try {
      setConfirmingBooking(true);

      // Update booking status to confirmed
      await api.patch(`/bookings/${bookingId}/confirm`);

      toast.success("Booking confirmed successfully!");
      // Wait a bit before redirecting to ensure the toast is visible
      setTimeout(() => {
        navigate("/user/bookings");
      }, 1500);
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to confirm booking. Please try again."
      );
    } finally {
      setConfirmingBooking(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );

  if (!booking)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <p className="text-yellow-700">No booking found</p>
        </div>
      </div>
    );

  const totalAmount = booking.total_amount || 0;
  const seats = booking.seats || [];
  const eventDate = booking.event_date
    ? format(new Date(booking.event_date), "EEEE, MMMM d, yyyy")
    : "Date not available";
  const eventTime = booking.event_time || "Time not available";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Booking Details</h1>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Booking #{bookingId}
          </span>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Event Information</h2>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-2">
              {booking.event_title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Date: {eventDate}</p>
                <p className="text-gray-600">Time: {eventTime}</p>
              </div>
              <div>
                <p className="text-gray-600">
                  Location: {booking.event_location}
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Selected Seats</h2>
          {seats.length > 0 ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="space-y-2">
                {seats.map((seat) => (
                  <li
                    key={seat.seat_id}
                    className="flex justify-between items-center"
                  >
                    <span className="font-medium">
                      {seat.seat_number} ({seat.seat_type || "Standard"})
                    </span>
                    <span>₹{seat.price_paid || 0}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total Amount:</span>
                  <span className="font-bold text-lg">₹{totalAmount}</span>
                </div>
              </div>
            </div>
          ) : (
            <p>No seat information available</p>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={confirmingBooking}
            className={`px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              confirmingBooking ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {confirmingBooking ? "Confirming..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
