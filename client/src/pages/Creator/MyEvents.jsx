import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function MyEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = async () => {
    try {
      const response = await api.get("/creator/events");
      setEvents(response.data.data.events);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (eventId) => {
    // Show confirmation dialog
    if (
      !window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/creator/events/${eventId}`);
      toast.success("Event deleted successfully");
      // Refresh events list
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete event");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
        <Link
          to="/creator/events/create"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Create New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            You haven't created any events yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.event_id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="h-48 bg-gray-200">
                {event.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {event.short_description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-600 font-medium">
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      to={`/creator/events/${event.event_id}`}
                      className="px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(event.event_id)}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
