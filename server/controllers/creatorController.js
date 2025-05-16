const Event = require("../models/eventModel");
const Booking = require("../models/bookingModel");
const AppError = require("../utils/appError");

class CreatorController {
  static async getMyEvents(req, res, next) {
    try {
      const [events] = await req.db.query(
        `SELECT e.*, c.name as category_name 
         FROM events e
         LEFT JOIN categories c ON e.category_id = c.category_id
         WHERE e.organizer_id = ?
         ORDER BY e.date ASC, e.time ASC`,
        [req.user.id]
      );

      res.status(200).json({
        status: "success",
        results: events.length,
        data: {
          events,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getEventDetails(req, res, next) {
    try {
      // Check if event exists and belongs to this organizer
      const [rows] = await req.db.query(
        `SELECT e.*, c.name as category_name 
         FROM events e
         LEFT JOIN categories c ON e.category_id = c.category_id
         WHERE e.event_id = ? AND e.organizer_id = ?`,
        [req.params.id, req.user.id]
      );

      if (!rows.length) {
        return next(new AppError("No event found with that ID", 404));
      }

      const event = rows[0];

      // Get event images
      const [images] = await req.db.query(
        "SELECT * FROM event_images WHERE event_id = ? ORDER BY display_order",
        [req.params.id]
      );

      // Get all seats
      const [seats] = await req.db.query(
        "SELECT * FROM seats WHERE event_id = ? ORDER BY seat_number",
        [req.params.id]
      );

      // Get bookings for this event
      const [bookings] = await req.db.query(
        `SELECT b.*, u.name as user_name, u.email as user_email
         FROM bookings b
         JOIN users u ON b.user_id = u.user_id
         WHERE b.event_id = ?
         ORDER BY b.booking_date DESC`,
        [req.params.id]
      );

      res.status(200).json({
        status: "success",
        data: {
          event: {
            ...event,
            images,
            seats,
            bookings,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getEventBookings(req, res, next) {
    try {
      // Check if event exists and belongs to this organizer
      const [event] = await req.db.query(
        "SELECT event_id FROM events WHERE event_id = ? AND organizer_id = ?",
        [req.params.id, req.user.id]
      );

      if (!event.length) {
        return next(new AppError("No event found with that ID", 404));
      }

      const [bookings] = await req.db.query(
        `SELECT b.*, u.name as user_name, u.email as user_email
         FROM bookings b
         JOIN users u ON b.user_id = u.user_id
         WHERE b.event_id = ?
         ORDER BY b.booking_date DESC`,
        [req.params.id]
      );

      res.status(200).json({
        status: "success",
        results: bookings.length,
        data: {
          bookings,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getEventStats(req, res, next) {
    try {
      // Check if event exists and belongs to this organizer
      const [event] = await req.db.query(
        "SELECT event_id, title FROM events WHERE event_id = ? AND organizer_id = ?",
        [req.params.id, req.user.id]
      );

      if (!event.length) {
        return next(new AppError("No event found with that ID", 404));
      }

      // Get total bookings
      const [bookingsCount] = await req.db.query(
        'SELECT COUNT(*) as count FROM bookings WHERE event_id = ? AND status = "confirmed"',
        [req.params.id]
      );

      // Get total revenue
      const [revenue] = await req.db.query(
        `SELECT SUM(p.amount) as total 
         FROM payments p
         JOIN bookings b ON p.booking_id = b.booking_id
         WHERE b.event_id = ? AND p.payment_status = "captured"`,
        [req.params.id]
      );

      // Get seats booked
      const [seatsBooked] = await req.db.query(
        `SELECT COUNT(*) as count 
         FROM booked_seats bs
         JOIN bookings b ON bs.booking_id = b.booking_id
         WHERE b.event_id = ? AND b.status = "confirmed"`,
        [req.params.id]
      );

      // Get available seats
      const [availableSeats] = await req.db.query(
        "SELECT available_seats FROM events WHERE event_id = ?",
        [req.params.id]
      );

      // Get recent bookings
      const [recentBookings] = await req.db.query(
        `SELECT b.booking_id, b.booking_date, b.total_amount, u.name as user_name
         FROM bookings b
         JOIN users u ON b.user_id = u.user_id
         WHERE b.event_id = ? AND b.status = "confirmed"
         ORDER BY b.booking_date DESC
         LIMIT 5`,
        [req.params.id]
      );

      res.status(200).json({
        status: "success",
        data: {
          event: event[0],
          stats: {
            bookings: bookingsCount[0].count,
            revenue: revenue[0].total || 0,
            seatsBooked: seatsBooked[0].count,
            availableSeats: availableSeats[0].available_seats,
          },
          recentBookings,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async addSeats(req, res, next) {
    try {
      // Check if event exists and belongs to this organizer
      const [event] = await req.db.query(
        "SELECT event_id, total_seats, available_seats FROM events WHERE event_id = ? AND organizer_id = ?",
        [req.params.id, req.user.id]
      );

      if (!event.length) {
        return next(new AppError("No event found with that ID", 404));
      }

      const { seats } = req.body;

      if (!Array.isArray(seats)) {
        return next(new AppError("Seats must be an array", 400));
      }

      // Insert new seats
      const values = seats.map((seat) => [
        req.params.id,
        seat.seat_number,
        seat.seat_type || "regular",
        seat.price_multiplier || 1.0,
      ]);

      await req.db.query(
        "INSERT INTO seats (event_id, seat_number, seat_type, price_multiplier) VALUES ?",
        [values]
      );

      // Update total seats count
      const [result] = await req.db.query(
        "SELECT COUNT(*) as count FROM seats WHERE event_id = ?",
        [req.params.id]
      );

      await req.db.query(
        "UPDATE events SET total_seats = ?, available_seats = ? WHERE event_id = ?",
        [result[0].count, result[0].count, req.params.id]
      );

      res.status(201).json({
        status: "success",
        message: "Seats added successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CreatorController;
