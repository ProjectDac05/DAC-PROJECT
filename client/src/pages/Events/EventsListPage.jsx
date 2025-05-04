// src/pages/EventsListPage.jsx
import React from "react";
import { Link } from "react-router-dom";

const EventsListPage = () => {
  // Sample static events for now
  const sampleEvents = [
    { id: 1, title: "Music Concert", date: "2025-06-10" },
    { id: 2, title: "Tech Conference", date: "2025-07-05" },
    { id: 3, title: "Art Expo", date: "2025-08-15" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Upcoming Events
      </h1>

      <ul className="space-y-4">
        {sampleEvents.map((event) => (
          <li
            key={event.id}
            className="p-4 border border-gray-300 rounded-lg bg-white shadow-sm"
          >
            <h2 className="text-xl font-semibold text-gray-700">
              {event.title}
            </h2>
            <p className="text-gray-500">Date: {event.date}</p>
            <Link
              to={`/events/${event.id}`}
              className="text-blue-500 hover:underline text-sm mt-2 inline-block"
            >
              View Details →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EventsListPage;
