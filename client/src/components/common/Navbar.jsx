import { Link, useNavigate } from "react-router-dom";

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-7">
            <Link to="/" className="flex items-center py-4 px-2">
              <span className="font-semibold text-gray-500 text-lg">
                EventBooking
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/events"
              className="py-4 px-2 text-gray-500 font-semibold hover:text-indigo-500 transition duration-300"
            >
              Events
            </Link>

            {user ? (
              <>
                {user.role === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    className="py-4 px-2 text-gray-500 font-semibold hover:text-indigo-500 transition duration-300"
                  >
                    Admin Dashboard
                  </Link>
                )}
                {user.role === "organizer" && (
                  <Link
                    to="/creator/dashboard"
                    className="py-4 px-2 text-gray-500 font-semibold hover:text-indigo-500 transition duration-300"
                  >
                    Creator Dashboard
                  </Link>
                )}
                <Link
                  to={
                    user.role === "organizer"
                      ? "/creator/events"
                      : user.role === "admin"
                      ? "/admin/events"
                      : "/user/bookings"
                  }
                  className="py-4 px-2 text-gray-500 font-semibold hover:text-indigo-500 transition duration-300"
                >
                  {user.role === "organizer"
                    ? "My Events"
                    : user.role === "admin"
                    ? "All Events"
                    : "My Bookings"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="py-2 px-3 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 transition duration-300"
                >
                  Logout
                </button>
                <Link
                  to={
                    user.role === "admin"
                      ? "/admin/dashboard"
                      : user.role === "organizer"
                      ? "/creator/dashboard"
                      : "/user/dashboard"
                  }
                  className="py-4 px-2 text-gray-500 hover:text-indigo-500 transition duration-300"
                >
                  Hi, {user.name.split(" ")[0]}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="py-2 px-3 text-gray-500 font-medium hover:text-indigo-500 transition duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="py-2 px-3 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 transition duration-300"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button className="outline-none mobile-menu-button">
              <svg
                className="w-6 h-6 text-gray-500"
                x-show="!showMenu"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="hidden mobile-menu">
        <ul className="">
          <li className="active">
            <Link
              to="/events"
              className="block text-sm px-2 py-4 text-white bg-indigo-500 font-semibold"
            >
              Events
            </Link>
          </li>
          {user ? (
            <>
              {user.role === "admin" && (
                <li>
                  <Link
                    to="/admin/dashboard"
                    className="block text-sm px-2 py-4 hover:bg-indigo-500 transition duration-300"
                  >
                    Admin Dashboard
                  </Link>
                </li>
              )}
              <li>
                <Link
                  to={
                    user.role === "organizer"
                      ? "/creator/events"
                      : user.role === "admin"
                      ? "/admin/events"
                      : "/user/bookings"
                  }
                  className="block text-sm px-2 py-4 hover:bg-indigo-500 transition duration-300"
                >
                  {user.role === "organizer"
                    ? "My Events"
                    : user.role === "admin"
                    ? "All Events"
                    : "My Bookings"}
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-sm px-2 py-4 hover:bg-indigo-500 transition duration-300"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  to="/login"
                  className="block text-sm px-2 py-4 hover:bg-indigo-500 transition duration-300"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="block text-sm px-2 py-4 hover:bg-indigo-500 transition duration-300"
                >
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
