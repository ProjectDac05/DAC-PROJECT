const Booking = require("../models/bookingModel");
const Event = require("../models/eventModel");
const AppError = require("../utils/appError");
const db = require("../config/db");

class BookingController {
  static async createBooking(req, res, next) {
    try {
      const { event_id, seat_ids, total_amount } = req.body;

      console.log("Creating booking with data:", {
        event_id,
        seat_ids,
        total_amount,
        user_id: req.user.user_id,
      });

      // 1) Check if event exists and is active
      const event = await Event.findById(event_id);
      if (!event || !event.is_active) {
        return next(new AppError("Event not found or not available", 404));
      }

      // 2) Validate seat_ids
      if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
        return next(new AppError("Please select at least one seat", 400));
      }

      // 3) Validate total_amount
      if (!total_amount || isNaN(total_amount) || total_amount <= 0) {
        return next(new AppError("Invalid total amount", 400));
      }

      // 4) Create booking
      const bookingId = await Booking.create({
        event_id,
        user_id: req.user.user_id,
        total_amount: parseFloat(total_amount),
      });

      console.log("Booking created with ID:", bookingId);

      // 5) Book the selected seats
      try {
        await Booking.bookSeats(bookingId, seat_ids);
      } catch (error) {
        console.error("Error booking seats:", error);
        // If seat booking fails, delete the booking and throw error
        await db.query("DELETE FROM bookings WHERE booking_id = ?", [
          bookingId,
        ]);
        return next(new AppError(error.message || "Failed to book seats", 400));
      } // 6) Update available seats in event
      await Event.update(event_id, {
        available_seats: event.available_seats - seat_ids.length,
      }); // 7) Create initial payment record
      await Booking.createPayment({
        booking_id: bookingId,
        amount: total_amount,
        payment_method: "razorpay",
        transaction_id: null,
        payment_status: "captured", // Using captured for successful payments
      });

      // 8) Get booking details with seats
      const booking = await Booking.findById(bookingId);
      const bookedSeats = await Booking.getBookedSeats(bookingId);

      res.status(201).json({
        status: "success",
        data: {
          booking: {
            ...booking,
            seats: bookedSeats,
          },
        },
      });
    } catch (err) {
      console.error("Error in createBooking:", err);
      next(err);
    }
  }

  static async getBooking(req, res, next) {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return next(new AppError("No booking found with that ID", 404));
      }

      // Check if user is the owner or admin
      if (booking.user_id !== req.user.user_id && req.user.role !== "admin") {
        return next(
          new AppError("You are not authorized to view this booking", 403)
        );
      }

      // Get booked seats
      const bookedSeats = await Booking.getBookedSeats(req.params.id);

      // Get payment details if exists
      const payment = await Booking.getPaymentDetails(req.params.id);

      res.status(200).json({
        status: "success",
        data: {
          booking: {
            ...booking,
            seats: bookedSeats,
            payment,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
  static async getUserBookings(req, res, next) {
    try {
      console.log("getUserBookings called with:", {
        user: req.user,
        headers: req.headers,
        cookies: req.cookies,
      });

      if (!req.user || !req.user.user_id) {
        console.error("No user ID found in request");
        return next(new AppError("User not authenticated", 401));
      }

      // First check if user has any bookings at all
      const [bookingCount] = await db.query(
        "SELECT COUNT(*) as count FROM bookings WHERE user_id = ?",
        [req.user.user_id]
      );

      console.log("Total bookings found:", bookingCount[0].count);

      const bookings = await Booking.findByUser(req.user.user_id);
      console.log(
        "Found bookings after processing:",
        JSON.stringify(bookings, null, 2)
      );

      // Always return an array, even if empty
      res.status(200).json({
        status: "success",
        data: {
          bookings: Array.isArray(bookings) ? bookings : [],
        },
      });
    } catch (err) {
      console.error("Error in getUserBookings:", err);
      console.error("Error stack:", err.stack);
      return next(new AppError(err.message || "Error fetching bookings", 500));
    }
  }

  static async cancelBooking(req, res, next) {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return next(new AppError("No booking found with that ID", 404));
      }

      // Check if user is the owner or admin
      if (booking.user_id !== req.user.user_id && req.user.role !== "admin") {
        return next(
          new AppError("You are not authorized to cancel this booking", 403)
        );
      }

      // Check if booking is already cancelled
      if (booking.status === "cancelled") {
        return next(new AppError("Booking is already cancelled", 400));
      }

      // Start transaction
      await db.query("START TRANSACTION");

      try {
        // Get event details and booked seats count
        const [eventDetails] = await db.query(
          `SELECT e.event_id, e.available_seats, e.total_seats, 
           (SELECT COUNT(*) FROM booked_seats WHERE booking_id = ?) as seat_count
           FROM events e
           JOIN bookings b ON e.event_id = b.event_id
           WHERE b.booking_id = ?`,
          [req.params.id, req.params.id]
        );

        if (!eventDetails.length) {
          throw new Error("Event details not found");
        }

        const { available_seats, total_seats, seat_count } = eventDetails[0];

        // Verify that cancelling won't violate the total seats constraint
        if (available_seats + seat_count > total_seats) {
          throw new Error(
            "Cannot cancel booking: would exceed total seats limit"
          );
        }

        // Update booking status to cancelled
        await Booking.updateStatus(req.params.id, "cancelled");

        // Update event available seats
        await db.query(
          "UPDATE events SET available_seats = available_seats + ? WHERE event_id = ?",
          [seat_count, booking.event_id]
        );

        // Mark seats as available
        await db.query(
          `UPDATE seats s
           JOIN booked_seats bs ON s.seat_id = bs.seat_id
           SET s.is_booked = FALSE
           WHERE bs.booking_id = ?`,
          [req.params.id]
        );

        // Commit transaction
        await db.query("COMMIT");

        res.status(200).json({
          status: "success",
          message: "Booking cancelled successfully",
        });
      } catch (err) {
        await db.query("ROLLBACK");
        console.error("Error in cancellation transaction:", err);
        return next(
          new AppError(err.message || "Failed to cancel booking", 400)
        );
      }
    } catch (err) {
      next(err);
    }
  }

  static async confirmBooking(req, res, next) {
    try {
      const { id } = req.params;

      // Check if booking exists
      const booking = await Booking.findById(id);
      if (!booking) {
        return next(new AppError("No booking found with that ID", 404));
      }

      // Check if user is the owner
      if (booking.user_id !== req.user.user_id) {
        return next(
          new AppError("You are not authorized to confirm this booking", 403)
        );
      }

      // Update booking status to confirmed
      await Booking.updateStatus(id, "confirmed");

      // Get updated booking details
      const updatedBooking = await Booking.findById(id);

      res.status(200).json({
        status: "success",
        data: {
          booking: updatedBooking,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = BookingController;
