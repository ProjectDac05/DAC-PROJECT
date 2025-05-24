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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");

    console.log("API Request:", {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      hasUser: !!user,
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

    // If the error is 401 and we haven't retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/refresh-token")
    ) {
      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No refresh token available");
        }

        // Try to refresh the token
        const response = await api.post("/auth/refresh-token");
        const { accessToken } = response.data;

        if (!accessToken) {
          throw new Error("No access token received");
        }

        localStorage.setItem("accessToken", accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login?session_expired=true";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export default api;
