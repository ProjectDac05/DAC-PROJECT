import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import EventCard from "../../components/events/EventCard";
import SearchFilters from "../../components/events/SearchFilters";

export default function EventsListPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "date_asc",
    minPrice: undefined,
    maxPrice: undefined,
    page: 1,
    limit: 9,
  });

  const observer = useRef();
  const lastEventElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams();

        if (filters.search) params.append("search", filters.search);
        if (filters.category) params.append("category", filters.category);
        if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.append("dateTo", filters.dateTo);
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.minPrice) params.append("minPrice", filters.minPrice);
        if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
        params.append("page", filters.page);
        params.append("limit", filters.limit);

        const queryString = params.toString();
        console.log("Fetching events with params:", queryString);

        const response = await api.get(`/events?${queryString}`);
        console.log("Events API Response:", response.data);

        if (
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data.events)
        ) {
          if (filters.page === 1) {
            setEvents(response.data.data.events);
          } else {
            setEvents((prev) => [...prev, ...response.data.data.events]);
          }
          setHasMore(response.data.data.events.length === filters.limit);
        } else {
          console.error("Invalid response format:", response.data);
          setError("Invalid response format from server");
        }
      } catch (err) {
        console.error("Error fetching events:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch events. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filters]);

  const handleSearch = (newFilters) => {
    console.log("Applying new filters:", newFilters);
    setEvents([]); // Clear existing events
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Upcoming Events</h1>
      <p className="text-gray-600 mb-8">
        Discover and book amazing events happening around you
      </p>

      <SearchFilters onSearch={handleSearch} />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event, index) => (
          <div
            key={event.event_id}
            ref={index === events.length - 1 ? lastEventElementRef : null}
            className="transform hover:scale-[1.02] transition-transform duration-200"
          >
            <EventCard event={event} />
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {!loading && !hasMore && events.length > 0 && (
        <div className="text-center py-8 text-gray-600">
          No more events to load
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            No events found matching your criteria.
          </div>
          <button
            onClick={() =>
              setFilters({
                search: "",
                category: "",
                dateFrom: "",
                dateTo: "",
                sortBy: "date_asc",
                minPrice: undefined,
                maxPrice: undefined,
                page: 1,
                limit: 9,
              })
            }
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
