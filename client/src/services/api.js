<<<<<<< HEAD
import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

export const fetchEvents = () => API.get('/events');
=======
// src/services/api.js
import axios from "axios";

export const fetchEvents = () => {
  return axios.get("https://your-api-url.com/events"); // ✅ Replace with your real API
};
>>>>>>> upstream/Dev
