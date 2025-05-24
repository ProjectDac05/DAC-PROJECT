import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "react-toastify";
import api from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import { HeartIcon } from "@heroicons/react/24/solid";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await api.get("/wishlist");
        setWishlist(response.data.data.wishlist);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch wishlist");
        console.error("Error fetching wishlist:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const handleRemoveFromWishlist = async (eventId) => {
    try {
      await api.delete(`/wishlist/${eventId}`);
      setWishlist((prev) => prev.filter((item) => item.event_id !== eventId));
      toast.success("Removed from wishlist");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to remove from wishlist"
      );
      console.error("Error removing from wishlist:", err);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
        <Link
          to="/events"
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Browse Events
        </Link>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-12">
          <HeartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Your wishlist is empty
          </h3>
          <p className="text-gray-600 mb-4">
            Start adding events to your wishlist to keep track of them.
          </p>
          <Link
            to="/events"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => {
            const eventDate = new Date(`${item.date} ${item.time}`);
            const formattedDate = isNaN(eventDate.getTime())
              ? "Invalid date"
              : format(eventDate, "EEEE, MMMM d, yyyy h:mm a");

            return (
              <div
                key={item.event_id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="relative h-48">
                  <img
                    className="absolute inset-0 h-full w-full object-cover"
                    src={item.image_url || "/images/event-placeholder.jpg"}
                    alt={item.title}
                  />
                  <button
                    onClick={() => handleRemoveFromWishlist(item.event_id)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-md hover:bg-gray-100"
                  >
                    <HeartIcon className="h-6 w-6 text-red-500" />
                  </button>
                </div>
                <div className="p-4">
                  <Link
                    to={`/events/${item.event_id}`}
                    className="text-xl font-semibold text-gray-900 hover:text-indigo-600 mb-2 block"
                  >
                    {item.title}
                  </Link>
                  <p className="text-gray-600 text-sm mb-2">{formattedDate}</p>
                  <p className="text-gray-600 text-sm mb-4">{item.location}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-bold text-gray-900">
                      ₹{parseFloat(item.price).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.available_seats} seats left
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
