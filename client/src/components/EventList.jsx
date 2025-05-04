import React, { useEffect, useState } from "react";
import { fetchEvents } from "../services/api";

const EventList = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents().then((res) => setEvents(res.data));
  }, []);

  return (
    <div>
      <h2>Events</h2>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            {event.name} - {event.date} - {event.location}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EventList;
