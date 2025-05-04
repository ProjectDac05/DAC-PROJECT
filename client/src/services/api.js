// src/services/api.js
import axios from "axios";

export const fetchEvents = () => {
  return axios.get("https://your-api-url.com/events"); // ✅ Replace with your real API
};
