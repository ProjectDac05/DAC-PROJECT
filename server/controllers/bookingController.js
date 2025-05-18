const Booking = require("../models/bookingModel");
const Event = require("../models/eventModel");
const AppError = require("../utils/appError");
const db = require("../config/db");
const logger = require("../utils/logger");
const { clearCache } = require("../middlewares/cacheMiddleware");

class BookingController {
  static async createBooking(req, res, next) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      logger.info(`Starting booking creation for event ${req.body.event_id}`);

      const { event_id, seat_ids, total_amount } = req.body;

      // 1) Check if event exists and is active
      const event = await Event.findById(event_id);
      if (!event || !event.is_active) {
        throw new AppError("Event not found or not available", 404);
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
      await Booking.bookSeats(bookingId, seat_ids);

      // 6) Get booking details with seats
      const booking = await Booking.findById(bookingId);
      const bookedSeats = await Booking.getBookedSeats(bookingId);

      await connection.commit();
      logger.info(`Successfully created booking ${bookingId}`);

      // Clear relevant caches
      clearCache(`/events/${event_id}`);
      clearCache("/events");

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
      await connection.rollback();
      logger.error(`Failed to create booking: ${err.message}`, { error: err });
      next(err);
    } finally {
      connection.release();
    }
  }

  static async getBooking(req, res, next) {
    try {
      logger.info(`Fetching booking details for ID: ${req.params.id}`);

      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        throw new AppError("No booking found with that ID", 404);
      }

      // Check if user is the owner or admin
      if (booking.user_id !== req.user.user_id && req.user.role !== "admin") {
        throw new AppError("You are not authorized to view this booking", 403);
      }

      // Get booked seats
      const bookedSeats = await Booking.getBookedSeats(req.params.id);

      // Get payment details if exists
      const payment = await Booking.getPaymentDetails(req.params.id);

      logger.info(`Successfully retrieved booking ${req.params.id}`);

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
      logger.error(`Error fetching booking: ${err.message}`, { error: err });
      next(err);
    }
  }

  static async getUserBookings(req, res, next) {
    try {
      logger.info(`Fetching bookings for user: ${req.user.user_id}`);

      const bookings = await Booking.findByUser(req.user.user_id);

      // Get seats for each booking
      const bookingsWithSeats = await Promise.all(
        bookings.map(async (booking) => {
          const seats = await Booking.getBookedSeats(booking.booking_id);
          return { ...booking, seats };
        })
      );

      logger.info(
        `Successfully retrieved ${bookings.length} bookings for user ${req.user.user_id}`
      );

      res.status(200).json({
        status: "success",
        results: bookingsWithSeats.length,
        data: {
          bookings: bookingsWithSeats,
        },
      });
    } catch (err) {
      logger.error(`Error fetching user bookings: ${err.message}`, {
        error: err,
      });
      next(err);
    }
  }

  static async cancelBooking(req, res, next) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      logger.info(`Starting cancellation for booking ${req.params.id}`);

      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        throw new AppError("No booking found with that ID", 404);
      }

      // Check if user is the owner or admin
      if (booking.user_id !== req.user.user_id && req.user.role !== "admin") {
        throw new AppError(
          "You are not authorized to cancel this booking",
          403
        );
      }

      // Check if booking is already cancelled
      if (booking.status === "cancelled") {
        throw new AppError("Booking is already cancelled", 400);
      }

      // Get booked seats before cancelling
      const bookedSeats = await Booking.getBookedSeats(req.params.id);

      // Get event details
      const event = await Event.findById(booking.event_id);
      if (!event) {
        throw new AppError("Associated event not found", 404);
      }

      // Update booking status to cancelled
      await Booking.updateStatus(req.params.id, "cancelled");

      // Mark seats as available
      const seatIds = bookedSeats.map((seat) => seat.seat_id);
      await db.query(
        "UPDATE seats SET is_booked = FALSE WHERE seat_id IN (?)",
        [seatIds]
      );

      await connection.commit();
      logger.info(`Successfully cancelled booking ${req.params.id}`);

      // Clear relevant caches
      clearCache(`/events/${booking.event_id}`);
      clearCache("/events");
      clearCache(`/bookings/${req.params.id}`);
      clearCache("/bookings/user/bookings");

      res.status(200).json({
        status: "success",
        message: "Booking cancelled successfully",
      });
    } catch (err) {
      await connection.rollback();
      logger.error(`Failed to cancel booking: ${err.message}`, { error: err });
      next(err);
    } finally {
      connection.release();
    }
  }

  static async confirmBooking(req, res, next) {
    try {
      logger.info(`Starting confirmation for booking ${req.params.id}`);

      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        throw new AppError("No booking found with that ID", 404);
      }

      // Check if user is the owner or admin
      if (booking.user_id !== req.user.user_id && req.user.role !== "admin") {
        throw new AppError(
          "You are not authorized to confirm this booking",
          403
        );
      }

      // Check if booking is already confirmed
      if (booking.status === "confirmed") {
        throw new AppError("Booking is already confirmed", 400);
      }

      // Update booking status to confirmed
      await Booking.updateStatus(req.params.id, "confirmed");

      logger.info(`Successfully confirmed booking ${req.params.id}`);

      // Clear relevant caches
      clearCache(`/bookings/${req.params.id}`);
      clearCache("/bookings/user/bookings");

      res.status(200).json({
        status: "success",
        message: "Booking confirmed successfully",
      });
    } catch (err) {
      logger.error(`Error confirming booking: ${err.message}`, { error: err });
      next(err);
    }
  }
}

module.exports = BookingController;
