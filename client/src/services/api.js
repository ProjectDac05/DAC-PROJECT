import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    // AND it's not a login or refresh token request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      originalRequest.url !== "/auth/refresh-token"
    ) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await api.post("/auth/refresh-token");
        const { accessToken } = response.data;

        // Update the token in localStorage
        localStorage.setItem("accessToken", accessToken);

        // Update the Authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, log out the user
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login?session_expired=true";
        return Promise.reject(refreshError);
      }
    }

    // If the error is 403 (Forbidden)
    if (error.response?.status === 403) {
      // Handle forbidden access
      window.location.href = "/login?access_denied=true";
    }

    return Promise.reject(error);
  }
);

export default api;
