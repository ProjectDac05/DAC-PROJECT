import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import api from "../../services/api";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    totalBookings: 0,
    wishlistCount: 0,
  });
  const [bookings, setBookings] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, wishlistRes] = await Promise.all([
        api.get("/bookings/user/bookings"),
        api.get("/wishlists/user"),
      ]);

      const allBookings = bookingsRes.data?.data?.bookings || [];
      const wishlist = wishlistRes.data?.data?.wishlist || [];

      // Filter out cancelled bookings first
      const activeBookings = allBookings.filter(
        (b) => b.status !== "cancelled"
      );

      // Calculate stats from active bookings only
      const confirmedBookings = activeBookings.filter(
        (b) => b.status === "confirmed"
      );
      const upcomingEvents = confirmedBookings.filter(
        (b) => new Date(b.event_date) > new Date()
      ).length;

      setStats({
        upcomingEvents,
        totalBookings: confirmedBookings.length,
        wishlistCount: wishlist.length,
      });

      // Set only active bookings
      setBookings(activeBookings);
      setWishlistItems(wishlist);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (eventId) => {
    try {
      await api.delete(`/wishlists/${eventId}`);
      setWishlistItems((items) =>
        items.filter((item) => item.event_id !== eventId)
      );
      setStats((prev) => ({ ...prev, wishlistCount: prev.wishlistCount - 1 }));
      toast.success("Removed from wishlist");
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      toast.error("Failed to remove from wishlist");
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">User Dashboard</h1>

      {/* Stats Cards */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Welcome back, {user?.name}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800">Upcoming Events</h3>
            <p className="text-2xl font-bold mt-2">{stats.upcomingEvents}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800">Total Bookings</h3>
            <p className="text-2xl font-bold mt-2">{stats.totalBookings}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-800">Wishlist</h3>
            <p className="text-2xl font-bold mt-2">{stats.wishlistCount}</p>
          </div>
        </div>
      </div>

      {/* Bookings Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">My Bookings</h2>
        <div className="max-h-[600px] overflow-y-auto">
          {bookings.length === 0 ? (
            <p className="text-gray-600">No bookings yet</p>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.booking_id}
                  className="border-b pb-4 last:border-0"
                >
                  <h3 className="font-medium">{booking.event_title}</h3>
                  <p className="text-sm text-gray-600">
                    {format(new Date(booking.event_date), "MMMM d, yyyy")} at{" "}
                    {booking.event_time}
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Wishlist Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Wishlist</h2>
        <div className="max-h-[600px] overflow-y-auto">
          {wishlistItems.length === 0 ? (
            <p className="text-gray-600">Your wishlist is empty</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlistItems.map((item) => (
                <div key={item.event_id} className="border rounded-lg p-4">
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <img
                      src={
                        item.image_url || "https://via.placeholder.com/300x200"
                      }
                      alt={item.title}
                      className="object-cover rounded-lg w-full h-48"
                    />
                  </div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(item.date), "MMMM d, yyyy")}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <a
                      href={`/events/${item.event_id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      View Details
                    </a>
                    <button
                      onClick={() => removeFromWishlist(item.event_id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
