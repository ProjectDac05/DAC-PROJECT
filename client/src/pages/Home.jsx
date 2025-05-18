// client/src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { motion as Motion } from "framer-motion";
import Interactive3DElement from "../components/Interactive3DElement";
import "../styles/animations.css";

function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <AnimatePresence>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] opacity-25"></div>

        {/* 3D Interactive Element */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <Interactive3DElement
            mouseX={mousePosition.x}
            mouseY={mousePosition.y}
          />
        </div>

        {/* Hero Section */}
        <div className="relative container mx-auto px-4 py-20">
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto backdrop-blur-sm bg-white/30 rounded-2xl p-8 shadow-2xl"
          >
            <Motion.h1
              className="text-6xl font-extrabold text-gray-900 mb-6"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              Welcome to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Event Booking
              </span>
            </Motion.h1>
            <Motion.p
              className="text-xl text-gray-700 mb-12 leading-relaxed max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Discover and book amazing events happening around you. Your next
              unforgettable experience is just a click away!
            </Motion.p>

            {/* Buttons Container */}
            <Motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
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
            </Motion.div>
          </Motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

export default HomePage;
