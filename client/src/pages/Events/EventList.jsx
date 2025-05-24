import { useState, useEffect } from "react";
import api from "../../services/api";
import SearchFilters from "../../components/events/SearchFilters";
import EventCard from "../../components/events/EventCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "date_asc",
    minPrice: "",
    maxPrice: "",
  });

  const fetchEvents = async (searchFilters) => {
    try {
      setLoading(true);
      setError(null);

      // Convert filters to URL parameters
      const params = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value);
        }
      });

      console.log("Fetching events with params:", Object.fromEntries(params));
      const response = await api.get(`/events?${params.toString()}`);

      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data.events)
      ) {
        setEvents(response.data.data.events);
      } else {
        console.error("Invalid response format:", response.data);
        setEvents([]);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.response?.data?.message || "Failed to load events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }; // Fetch events only once on component mount using initial filters
  useEffect(() => {
    fetchEvents({ ...filters }); // Use a copy of initial filters
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (newFilters) => {
    console.log("Applying filters:", newFilters);
    // Convert empty strings to undefined for numbers
    const processedFilters = {
      ...newFilters,
      minPrice:
        newFilters.minPrice === "" ? undefined : Number(newFilters.minPrice),
      maxPrice:
        newFilters.maxPrice === "" ? undefined : Number(newFilters.maxPrice),
    };
    setFilters(processedFilters);
    fetchEvents(processedFilters);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SearchFilters onSearch={handleSearch} />
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SearchFilters onSearch={handleSearch} />
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SearchFilters onSearch={handleSearch} />

      {events.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl text-gray-600">No events found</h3>
          <p className="text-gray-500 mt-2">
            Try adjusting your search filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.event_id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
