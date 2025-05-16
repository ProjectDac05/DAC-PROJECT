import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import api from "../../services/api";
import SeatMap from "../../components/events/SeatMap";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const [eventResponse, seatsResponse] = await Promise.all([
          api.get(`/events/${id}`),
          api.get(`/events/${id}/seats`),
        ]);

        setEvent(eventResponse.data);
        setSeats(seatsResponse.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch event details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  const handleSeatSelect = (seatId) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
  };

  const handleBookNow = async () => {
    // Check if user is logged in
    const token = localStorage.getItem("accessToken");
    if (!token) {
      // Save current state to localStorage
      localStorage.setItem(
        "bookingRedirect",
        JSON.stringify({
          eventId: id,
          selectedSeats,
        })
      );
      // Redirect to login
      navigate("/login?redirect=/events/" + id);
      return;
    }

    if (selectedSeats.length === 0) {
      setError("Please select at least one seat");
      return;
    }

    try {
      setBookingLoading(true);
      setError("");

      // Create booking
      const bookingResponse = await api.post("/bookings", {
        event_id: id,
        seat_ids: selectedSeats,
      });

      // Redirect to checkout page
      navigate(`/checkout/${bookingResponse.data.bookingId}`);
    } catch (err) {
      console.error("Booking error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.setItem(
          "bookingRedirect",
          JSON.stringify({
            eventId: id,
            selectedSeats,
          })
        );
        navigate("/login?redirect=/events/" + id);
      } else {
        setError(err.response?.data?.message || "Failed to create booking");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!event) return <ErrorMessage message="Event not found" />;

  // Ensure valid date-time
  const eventDateTime = new Date(`${event.date} ${event.time}`);
  const formattedDate = isNaN(eventDateTime.getTime())
    ? "Invalid date"
    : format(eventDateTime, "EEEE, MMMM d, yyyy h:mm a");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Event Header */}
        <div className="relative h-64 bg-gray-200">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src={event.image_url || "/images/event-placeholder.jpg"}
            alt={event.title}
          />
        </div>

        {/* Event Details */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {event.title}
              </h1>
              <div className="flex items-center text-gray-600 mb-4">
                <span className="mr-4">{formattedDate}</span>
                <span>{event.location}</span>
              </div>
              <div className="bg-indigo-100 text-indigo-800 inline-block px-3 py-1 rounded-full text-sm font-medium mb-4">
                {event.category_name || "General"}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg md:w-64">
              <div className="text-xl font-bold text-gray-900 mb-2">
                ₹
                {event.price && !isNaN(event.price)
                  ? parseFloat(event.price).toFixed(2)
                  : "N/A"}
              </div>

              <div className="text-sm text-gray-600 mb-4">
                {event.total_seats - event.booked_seats} of {event.total_seats}{" "}
                seats available
              </div>
              {selectedSeats.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">
                    Selected: {selectedSeats.length} seat(s)
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    Total: ₹
                    {selectedSeats
                      .reduce((total, seatId) => {
                        const seat = seats.find((s) => s.seat_id === seatId);
                        return (
                          total + (seat ? parseFloat(seat.final_price) : 0)
                        );
                      }, 0)
                      .toFixed(2)}
                  </p>
                </div>
              )}
              <button
                onClick={handleBookNow}
                disabled={bookingLoading || selectedSeats.length === 0}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  bookingLoading || selectedSeats.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {bookingLoading ? "Processing..." : "Book Now"}
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              About the Event
            </h2>
            <p className="text-gray-700 whitespace-pre-line">
              {event.description}
            </p>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Venue Details
            </h2>
            <p className="text-gray-700">
              {event.venue_details || "Venue details not specified"}
            </p>
          </div>
        </div>

        {/* Seat Selection */}
        <div className="px-6 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Select Your Seats
          </h2>
          <SeatMap
            seats={seats}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelect}
          />
        </div>
      </div>
    </div>
  );
}
