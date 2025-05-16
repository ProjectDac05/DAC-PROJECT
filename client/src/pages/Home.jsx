// client/src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../styles/animations.css";

function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] opacity-25"></div>

      {/* Animated Gradient Orbs */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Hero Section */}
      <div className="relative container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto backdrop-blur-sm bg-white/30 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-6xl font-extrabold text-gray-900 mb-6 animate-fade-in">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Event Booking
            </span>
          </h1>
          <p className="text-xl text-gray-700 mb-12 leading-relaxed max-w-2xl mx-auto">
            Discover and book amazing events happening around you. Your next
            unforgettable experience is just a click away!
          </p>

          {/* Buttons Container */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/events"
              className="group w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl relative overflow-hidden"
            >
              <span className="relative z-10">Browse Events</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </Link>

            <div className="flex gap-4 w-full sm:w-auto">
              <Link
                to="/login"
                className="flex-1 sm:flex-none px-8 py-4 text-lg font-semibold text-indigo-700 bg-white/80 backdrop-blur-sm border-2 border-indigo-600/30 rounded-xl hover:bg-indigo-50 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl hover:border-indigo-600"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="group flex-1 sm:flex-none px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl hover:from-purple-700 hover:to-purple-800 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl relative overflow-hidden"
              >
                <span className="relative z-10">Sign Up</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
