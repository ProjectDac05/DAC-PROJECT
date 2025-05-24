import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "react-toastify";
import api from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function CheckoutPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/bookings/${bookingId}`);
        setBooking(response.data.data.booking);
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError(
          err.response?.data?.message || "Failed to load booking details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingData();
    }
  }, [bookingId]);

  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      setError("");

      // Create payment intent
      const {
        data: { data: paymentData },
      } = await api.post("/payments/create-intent", {
        booking_id: bookingId,
      });

      // Initialize Razorpay
      const options = {
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "Event Booking",
        description: `Booking for ${booking.event_title}`,
        order_id: paymentData.order_id,
        handler: async (response) => {
          try {
            // Verify payment
            await api.post("/payments/confirm", {
              booking_id: bookingId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success("Payment successful!");
            navigate("/user/bookings");
          } catch (err) {
            console.error("Payment verification error:", err);
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: booking.user_name,
          email: booking.user_email,
        },
        theme: {
          color: "#4F46E5",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.response?.data?.message || "Failed to process payment");
      toast.error("Payment failed. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      setConfirming(true);
      setError("");

      // Update booking status to confirmed
      await api.post(`/bookings/${bookingId}/confirm`);

      toast.success("Booking confirmed successfully!");
      navigate("/user/bookings");
    } catch (err) {
      console.error("Confirmation error:", err);
      setError(err.response?.data?.message || "Failed to confirm booking");
      toast.error("Failed to confirm booking. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!booking) return <ErrorMessage message="No booking found" />;

  const eventDateTime = new Date(`${booking.event_date} ${booking.event_time}`);
  const formattedDate = isNaN(eventDateTime.getTime())
    ? "Invalid date"
    : format(eventDateTime, "EEEE, MMMM d, yyyy h:mm a");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Booking Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Booking Summary
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">
                {booking.event_title}
              </h3>
              <p className="text-gray-600">{formattedDate}</p>
              <p className="text-gray-600">{booking.event_location}</p>
            </div>

            {/* Selected Seats */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Selected Seats</h3>
              <div className="bg-gray-50 rounded-md p-4">
                {booking.seats.map((seat) => (
                  <div
                    key={seat.seat_id}
                    className="flex justify-between items-center mb-2 last:mb-0"
                  >
                    <span className="text-gray-700">
                      Seat {seat.seat_number} ({seat.seat_type})
                    </span>
                    <span className="font-medium">
                      ₹{parseFloat(seat.price_paid).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Amount */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Amount</span>
                <span>₹{parseFloat(booking.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          {/* Direct Confirmation Button */}
          <button
            onClick={handleConfirmBooking}
            disabled={confirming}
            className={`px-6 py-3 bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              confirming ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {confirming ? "Confirming..." : "Confirm Booking"}
          </button>

          {/* Payment Button (disabled for now) */}
          <button
            onClick={handlePayment}
            disabled={true}
            className={`px-6 py-3 bg-gray-400 text-white font-medium rounded-md shadow-sm cursor-not-allowed opacity-50 ${
              paymentLoading ? "opacity-75" : ""
            }`}
            title="Online payment will be available soon"
          >
            {paymentLoading ? "Processing..." : "Pay Online (Coming Soon)"}
          </button>
        </div>
      </div>
    </div>
  );
}
