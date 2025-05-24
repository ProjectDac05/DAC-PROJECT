import { useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/authContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  console.log("Login component rendered");

  // Get redirect path from URL params
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get("redirect");

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted");

    setLoading(true);
    setError("");

    try {
      // Make the login API request
      const response = await api.post("/auth/login", { email, password });
      console.log("Server response:", response.data);

      if (
        !response.data ||
        !response.data.status ||
        response.data.status !== "success"
      ) {
        throw new Error("Invalid response format from server");
      }

      const { token, user } = response.data.data;

      if (!token || !user) {
        throw new Error("Missing token or user data in response");
      }

      // Map the user data to match expected format
      const userData = {
        userId: user.user_id,
        name: user.name || "User",
        role: user.role,
        email: user.email,
      };

      // Use the auth context login function
      await login(token, userData);

      // Default role-based redirect
      const dashboardPath =
        userData.role === "admin"
          ? "/admin/dashboard"
          : userData.role === "organizer"
          ? "/creator/dashboard"
          : "/user/dashboard";

      // Check for saved booking state
      const savedBooking = localStorage.getItem("bookingRedirect");
      if (savedBooking && redirectPath?.startsWith("/events/")) {
        localStorage.removeItem("bookingRedirect");
        navigate(redirectPath);
        return;
      }

      // Navigate to redirect path or default dashboard
      navigate(redirectPath || dashboardPath);
    } catch (err) {
      console.error("Login error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });

      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          {redirectPath && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Please sign in to continue with your booking
            </p>
          )}
        </div>
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
