import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import SeatMap from "./SeatMap";

const EventDetailsPage = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const [eventResponse, seatsResponse] = await Promise.all([
          api.get(`/events/${eventId}`),
          api.get(`/events/${eventId}/seats`),
        ]);
        setEvent(eventResponse.data);
        setSeats(seatsResponse.data);
      } catch (error) {
        console.error("Error fetching event details:", error);
        toast.error("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

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
    try {
      if (selectedSeats.length === 0) {
        toast.error("Please select at least one seat");
        return;
      }

      // Log the seats data for debugging
      console.log("Current seats data:", {
        allSeats: seats,
        selectedSeats: selectedSeats,
        selectedSeatsDetails: seats.filter((seat) =>
          selectedSeats.includes(seat.seat_id)
        ),
      });

      const bookingData = {
        event_id: Number(eventId),
        seat_ids: selectedSeats,
      };

      console.log("Sending booking request:", bookingData);

      const response = await api.post("/bookings", bookingData);

      if (response.data.bookingId) {
        toast.success("Booking created successfully!");
        navigate(`/bookings/${response.data.bookingId}`);
      }
    } catch (error) {
      console.error("Booking error:", {
        error: error.response?.data,
        requestData: {
          event_id: Number(eventId),
          seat_ids: selectedSeats,
        },
        selectedSeatsInfo: seats.filter((seat) =>
          selectedSeats.includes(seat.seat_id)
        ),
        allSeats: seats,
      });
      toast.error(error.response?.data?.message || "Failed to create booking");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!event) {
    return <div>Event not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{event.title}</h1>
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <SeatMap
          seats={seats}
          selectedSeats={selectedSeats}
          onSeatSelect={handleSeatSelect}
        />
      </div>
      <div className="flex justify-center">
        <button
          onClick={handleBookNow}
          disabled={selectedSeats.length === 0}
          className={`px-6 py-2 rounded-lg font-medium ${
            selectedSeats.length === 0
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default EventDetailsPage;
