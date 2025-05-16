import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

console.log("API Configuration:", {
  baseURL: API_URL,
  env: import.meta.env.MODE,
  VITE_API_URL: import.meta.env.VITE_API_URL,
});

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
    console.log("Request interceptor:", {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      headers: config.headers,
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", {
      message: error.message,
      config: error.config,
    });
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log("Response interceptor success:", {
      url: response.config.url,
      status: response.status,
      headers: response.headers,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.log("Response interceptor error:", {
      status: error.response?.status,
      url: originalRequest?.url,
      message: error.message,
      retried: !!originalRequest?._retry,
    });

    // If the error is 401 and we haven't tried to refresh the token yet
    // AND it's not a login or refresh token request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      originalRequest.url !== "/auth/refresh-token"
    ) {
      originalRequest._retry = true;
      console.log("Attempting token refresh...");

      try {
        // Try to refresh the token
        const response = await api.post("/auth/refresh-token");
        const { accessToken } = response.data;
        console.log("Token refresh successful");

        // Update the token in localStorage
        localStorage.setItem("accessToken", accessToken);

        // Update the Authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", {
          message: refreshError.message,
          status: refreshError.response?.status,
          data: refreshError.response?.data,
        });
        // If refresh token fails, log out the user
        localStorage.removeItem("accessToken");
        window.location.href = "/login?session_expired=true";
        return Promise.reject(refreshError);
      }
    }

    // If the error is 403 (Forbidden)
    if (error.response?.status === 403) {
      console.log("Access forbidden - redirecting to login");
      // Handle forbidden access
      window.location.href = "/login?access_denied=true";
    }

    return Promise.reject(error);
  }
);

export default api;
