import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

export default function CheckoutPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        console.log("Fetching data for booking:", bookingId);
        setLoading(true);
        setError("");

        const response = await api.get(`/api/bookings/${bookingId}`);
        console.log("Booking data received:", response.data);
        setBooking(response.data);
      } catch (error) {
        console.error("Error fetching booking data:", error);
        setError(
          error.response?.data?.message ||
            "Failed to load booking details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingData();
    }
  }, [bookingId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!booking) return <div>No booking found</div>;

  return (
    <div className="checkout-page">
      <h1>Booking Details</h1>

      <div className="booking-info">
        <h2>Event: {booking.event.title}</h2>
        <p>Date: {new Date(booking.event.date).toLocaleDateString()}</p>
        <p>Time: {booking.event.time}</p>
        <p>Location: {booking.event.location}</p>
      </div>

      <div className="seats-info">
        <h3>Selected Seats</h3>
        <ul>
          {booking.seats.map((seat) => (
            <li key={seat.seat_id}>
              {seat.seat_number} ({seat.seat_type}) - ₹{seat.price_paid}
            </li>
          ))}
        </ul>
      </div>

      <div className="payment-info">
        <h3>Payment Details</h3>
        {booking.payment ? (
          <>
            <p>Status: {booking.payment.payment_status}</p>
            <p>Amount Paid: ₹{booking.payment.amount}</p>
            <p>Payment Method: {booking.payment.payment_method}</p>
            {booking.payment.receipt_url && (
              <a
                href={booking.payment.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Receipt
              </a>
            )}
          </>
        ) : (
          <p>No payment information available</p>
        )}
      </div>

      <div className="total-amount">
        <h3>Total Amount: ₹{booking.total_amount}</h3>
      </div>
    </div>
  );
}
