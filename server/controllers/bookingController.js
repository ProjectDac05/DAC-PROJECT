const Booking = require("../models/bookingModel");
const Event = require("../models/eventModel");
const AppError = require("../utils/appError");
const db = require("../config/db");

class BookingController {
  static async createBooking(req, res, next) {
    try {
      const { event_id, seat_ids, total_amount } = req.body;

      // 1) Check if event exists and is active
      const event = await Event.findById(event_id);
      if (!event || !event.is_active) {
        return next(new AppError("Event not found or not available", 404));
      }

      // 2) Validate seat_ids
      if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
        return next(new AppError("Please select at least one seat", 400));
      }

      // 3) Create booking
      const bookingId = await Booking.create({
        event_id,
        user_id: req.user.user_id,
        total_amount,
      });

      // 4) Book the selected seats
      try {
        await Booking.bookSeats(bookingId, seat_ids);
      } catch (error) {
        // If seat booking fails, delete the booking and throw error
        await db.query("DELETE FROM bookings WHERE booking_id = ?", [
          bookingId,
        ]);
        return next(new AppError(error.message || "Failed to book seats", 400));
      }

      // 5) Update available seats in event
      await Event.update(event_id, {
        available_seats: event.available_seats - seat_ids.length,
      });

      // 6) Get booking details with seats
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
      const bookings = await Booking.findByUser(req.user.user_id);

      // Get seats for each booking
      const bookingsWithSeats = await Promise.all(
        bookings.map(async (booking) => {
          const seats = await Booking.getBookedSeats(booking.booking_id);
          return { ...booking, seats };
        })
      );

      res.status(200).json({
        status: "success",
        results: bookingsWithSeats.length,
        data: {
          bookings: bookingsWithSeats,
        },
      });
    } catch (err) {
      next(err);
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

      // Get booked seats before cancelling
      const bookedSeats = await Booking.getBookedSeats(req.params.id);

      // Get event details to verify seat constraints
      const event = await Event.findById(booking.event_id);
      if (!event) {
        return next(new AppError("Associated event not found", 404));
      }

      // Verify that adding back seats won't exceed total_seats
      const newAvailableSeats = event.available_seats + bookedSeats.length;
      if (newAvailableSeats > event.total_seats) {
        return next(
          new AppError(
            "Cannot cancel booking: Would exceed total seats capacity",
            400
          )
        );
      }

      // Update booking status to cancelled
      await Booking.updateStatus(req.params.id, "cancelled");

      // Update event available seats
      await Event.update(booking.event_id, {
        available_seats: newAvailableSeats,
      });

      // Mark seats as available
      const seatIds = bookedSeats.map((seat) => seat.seat_id);
      await db.query(
        "UPDATE seats SET is_booked = FALSE WHERE seat_id IN (?)",
        [seatIds]
      );

      res.status(200).json({
        status: "success",
        message: "Booking cancelled successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = BookingController;
