const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const AppError = require("../utils/appError");
const db = require("../config/db");
const Booking = require("../models/bookingModel");

module.exports = {
  // Protect routes - check if user is logged in
  protect: async (req, res, next) => {
    try {
      // 1) Get token from header
      let token;
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        return next(
          new AppError(
            "You are not logged in. Please log in to get access.",
            401
          )
        );
      } // 2) Verify token
      console.log("Verifying token:", token);
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );
      console.log("Decoded token:", decoded);

      // 3) Check if user still exists
      const [rows] = await db.query(
        "SELECT user_id, name, email, role FROM users WHERE user_id = ?",
        [decoded.id]
      );

      console.log("User found:", rows[0]);

      if (!rows.length) {
        return next(
          new AppError(
            "The user belonging to this token no longer exists.",
            401
          )
        );
      }

      // 4) Check if user changed password after token was issued
      // Add this if you implement password change functionality

      // Grant access to protected route
      req.user = rows[0];
      next();
    } catch (err) {
      if (err.name === "JsonWebTokenError") {
        return next(new AppError("Invalid token. Please log in again.", 401));
      }
      if (err.name === "TokenExpiredError") {
        return next(
          new AppError("Your token has expired. Please log in again.", 401)
        );
      }
      next(err);
    }
  },

  // Restrict to certain roles
  restrictTo: (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(
          new AppError("You do not have permission to perform this action", 403)
        );
      }
      next();
    };
  },

  // Check if user is event organizer or admin
  isEventOrganizerOrAdmin: async (req, res, next) => {
    try {
      // For admin, just continue
      if (req.user.role === "admin") return next();

      // For event routes, check if user is the organizer
      if (req.params.id) {
        const [event] = await db.query(
          "SELECT organizer_id FROM events WHERE event_id = ?",
          [req.params.id]
        );

        if (!event.length) {
          return next(new AppError("No event found with that ID", 404));
        }

        if (event[0].organizer_id !== req.user.user_id) {
          return next(
            new AppError(
              "You do not have permission to perform this action",
              403
            )
          );
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  },

  // Check if user is booking owner or admin
  isBookingOwnerOrAdmin: async (req, res, next) => {
    try {
      // For admin, just continue
      if (req.user.role === "admin") return next();

      // For booking routes, check if user is the owner
      if (req.params.id) {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
          return next(new AppError("No booking found with that ID", 404));
        }

        if (booking.user_id !== req.user.user_id) {
          return next(
            new AppError(
              "You do not have permission to perform this action",
              403
            )
          );
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  },
};
