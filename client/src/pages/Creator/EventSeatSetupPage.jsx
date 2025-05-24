import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function EventSeatSetupPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError("No event ID provided");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/events/${id}`);
        if (!response.data.data.event) {
          throw new Error("Event data not found in response");
        }

        // Convert string values to numbers
        const eventData = response.data.data.event;
        eventData.price = parseFloat(eventData.price);
        eventData.total_seats = parseInt(eventData.total_seats);
        eventData.available_seats = parseInt(eventData.available_seats);
        eventData.capacity = parseInt(eventData.capacity);

        setEvent(eventData);
      } catch (err) {
        console.error("Error fetching event:", err);
        setError(
          err.response?.data?.message || err.message || "Failed to fetch event"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const generateSeatLayout = () => {
    if (!event || !event.total_seats) {
      setError("Event data is missing");
      return;
    }

    const newSeats = [];
    const rows = Math.ceil(event.total_seats / 10);

    for (let row = 0; row < rows; row++) {
      const rowLetter = String.fromCharCode(65 + row);
      const seatsInRow = row === rows - 1 ? event.total_seats % 10 || 10 : 10;

      for (let seatNum = 1; seatNum <= seatsInRow; seatNum++) {
        newSeats.push({
          seat_number: `${rowLetter}${seatNum}`,
          seat_type: "regular",
          price_multiplier: 1.0,
        });
      }
    }

    setSeats(newSeats);
  };

  const handleSeatTypeChange = (index, type) => {
    const newSeats = [...seats];
    newSeats[index].seat_type = type;

    // Adjust price multiplier based on seat type
    newSeats[index].price_multiplier =
      type === "vip" ? 1.5 : type === "premium" ? 2.0 : 1.0;

    setSeats(newSeats);
  };

  const handleSubmit = async () => {
    if (!id) {
      setError("No event ID available");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await api.post(`/events/${id}/seats`, { seats });
      navigate(`/creator/events/${id}`);
    } catch (err) {
      console.error("Error saving seats:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save seat layout"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (typeof price !== "number" || isNaN(price)) {
      return "0.00";
    }
    return price.toFixed(2);
  };

  if (loading)
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  if (error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  if (!event)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Event not found
        </div>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Setup Seat Layout for {event.title}
      </h1>
      <p className="text-gray-600 mb-6">
        Total seats: {event.total_seats} | Base price: ₹
        {formatPrice(event.price)}
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {seats.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="mb-4">No seat layout configured yet</p>
          <button
            onClick={generateSeatLayout}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Generate Default Layout
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <div className="flex justify-center mb-6">
              <div className="text-center py-4 bg-gray-100 rounded-lg w-full max-w-md">
                <div className="text-lg font-medium text-gray-700">STAGE</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seats.map((seat, index) => (
                <div key={index} className="border p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{seat.seat_number}</span>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                      ₹{formatPrice(event.price * seat.price_multiplier)}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSeatTypeChange(index, "regular")}
                      className={`px-2 py-1 text-xs rounded ${
                        seat.seat_type === "regular"
                          ? "bg-blue-500 text-white"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      Regular
                    </button>
                    <button
                      onClick={() => handleSeatTypeChange(index, "vip")}
                      className={`px-2 py-1 text-xs rounded ${
                        seat.seat_type === "vip"
                          ? "bg-purple-500 text-white"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      VIP
                    </button>
                    <button
                      onClick={() => handleSeatTypeChange(index, "premium")}
                      className={`px-2 py-1 text-xs rounded ${
                        seat.seat_type === "premium"
                          ? "bg-yellow-500 text-white"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      Premium
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 ${
                submitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? "Saving..." : "Save Seat Layout"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
