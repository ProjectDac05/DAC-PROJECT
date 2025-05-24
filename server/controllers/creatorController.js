const Event = require("../models/eventModel");
const Booking = require("../models/bookingModel");
const AppError = require("../utils/appError");
const db = require("../config/db");

class CreatorController {
  static async getMyEvents(req, res, next) {
    try {
      const [events] = await db.query(
        `SELECT e.*, c.name as category_name 
         FROM events e
         LEFT JOIN categories c ON e.category_id = c.category_id
         WHERE e.organizer_id = ?
         ORDER BY e.date ASC, e.time ASC`,
        [req.user.user_id]
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
      const [rows] = await db.query(
        `SELECT e.*, c.name as category_name 
         FROM events e
         LEFT JOIN categories c ON e.category_id = c.category_id
         WHERE e.event_id = ? AND e.organizer_id = ?`,
        [req.params.id, req.user.user_id]
      );

      if (!rows.length) {
        return next(new AppError("No event found with that ID", 404));
      }

      const event = rows[0];

      // Get event images
      const [images] = await db.query(
        "SELECT * FROM event_images WHERE event_id = ? ORDER BY display_order",
        [req.params.id]
      );

      // Get all seats
      const [seats] = await db.query(
        "SELECT * FROM seats WHERE event_id = ? ORDER BY seat_number",
        [req.params.id]
      );

      // Get bookings for this event
      const [bookings] = await db.query(
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
      const [event] = await db.query(
        "SELECT event_id FROM events WHERE event_id = ? AND organizer_id = ?",
        [req.params.id, req.user.user_id]
      );

      if (!event.length) {
        return next(new AppError("No event found with that ID", 404));
      }

      const [bookings] = await db.query(
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
      const [event] = await db.query(
        "SELECT event_id, title FROM events WHERE event_id = ? AND organizer_id = ?",
        [req.params.id, req.user.user_id]
      );

      if (!event.length) {
        return next(new AppError("No event found with that ID", 404));
      }

      // Get total bookings
      const [bookingsCount] = await db.query(
        'SELECT COUNT(*) as count FROM bookings WHERE event_id = ? AND status = "confirmed"',
        [req.params.id]
      );

      // Get total revenue
      const [revenue] = await db.query(
        `SELECT SUM(p.amount) as total 
         FROM payments p
         JOIN bookings b ON p.booking_id = b.booking_id
         WHERE b.event_id = ? AND p.payment_status = "captured"`,
        [req.params.id]
      );

      // Get seats booked
      const [seatsBooked] = await db.query(
        `SELECT COUNT(*) as count 
         FROM booked_seats bs
         JOIN bookings b ON bs.booking_id = b.booking_id
         WHERE b.event_id = ? AND b.status = "confirmed"`,
        [req.params.id]
      );

      // Get available seats
      const [availableSeats] = await db.query(
        "SELECT available_seats FROM events WHERE event_id = ?",
        [req.params.id]
      );

      // Get recent bookings
      const [recentBookings] = await db.query(
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
      const [event] = await db.query(
        "SELECT event_id, total_seats, available_seats FROM events WHERE event_id = ? AND organizer_id = ?",
        [req.params.id, req.user.user_id]
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

      await db.query(
        "INSERT INTO seats (event_id, seat_number, seat_type, price_multiplier) VALUES ?",
        [values]
      );

      // Update total seats count
      const [result] = await db.query(
        "SELECT COUNT(*) as count FROM seats WHERE event_id = ?",
        [req.params.id]
      );

      await db.query(
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

  static async getCreatorStats(req, res, next) {
    try {
      // Get total events
      const [eventsResult] = await db.query(
        "SELECT COUNT(*) as count FROM events WHERE organizer_id = ?",
        [req.user.user_id]
      );

      // Get total bookings and revenue
      const [bookingStats] = await db.query(
        `SELECT 
          COUNT(DISTINCT b.booking_id) as total_bookings,
          COALESCE(SUM(p.amount), 0) as total_revenue
         FROM events e
         LEFT JOIN bookings b ON e.event_id = b.event_id
         LEFT JOIN payments p ON b.booking_id = p.booking_id
         WHERE e.organizer_id = ? AND b.status = 'confirmed' AND p.payment_status = 'captured'`,
        [req.user.user_id]
      );

      // Get recent bookings
      const [recentBookings] = await db.query(
        `SELECT b.*, e.title as event_title, u.name as user_name
         FROM bookings b
         JOIN events e ON b.event_id = e.event_id
         JOIN users u ON b.user_id = u.user_id
         WHERE e.organizer_id = ? AND b.status = 'confirmed'
         ORDER BY b.booking_date DESC
         LIMIT 5`,
        [req.user.user_id]
      );

      // Get popular events
      const [popularEvents] = await db.query(
        `SELECT e.*, 
          COUNT(DISTINCT b.booking_id) as booking_count,
          COUNT(DISTINCT w.wishlist_id) as wishlist_count,
          COALESCE(SUM(p.amount), 0) as revenue
         FROM events e
         LEFT JOIN bookings b ON e.event_id = b.event_id
         LEFT JOIN wishlists w ON e.event_id = w.event_id
         LEFT JOIN payments p ON b.booking_id = p.booking_id
         WHERE e.organizer_id = ? AND (b.status = 'confirmed' OR b.status IS NULL)
         GROUP BY e.event_id
         ORDER BY booking_count DESC
         LIMIT 5`,
        [req.user.user_id]
      );

      // Get upcoming events
      const [upcomingEvents] = await db.query(
        `SELECT e.*, 
          COUNT(DISTINCT b.booking_id) as booking_count,
          COUNT(DISTINCT w.wishlist_id) as wishlist_count
         FROM events e
         LEFT JOIN bookings b ON e.event_id = b.event_id AND b.status = 'confirmed'
         LEFT JOIN wishlists w ON e.event_id = w.event_id
         WHERE e.organizer_id = ? AND e.date >= CURDATE()
         GROUP BY e.event_id
         ORDER BY e.date ASC
         LIMIT 5`,
        [req.user.user_id]
      );

      res.status(200).json({
        status: "success",
        data: {
          stats: {
            totalEvents: eventsResult[0].count,
            totalBookings: bookingStats[0].total_bookings || 0,
            totalRevenue: bookingStats[0].total_revenue || 0,
          },
          recentBookings,
          popularEvents,
          upcomingEvents,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getEventInsights(req, res, next) {
    try {
      // Check if event exists and belongs to this organizer
      const [event] = await db.query(
        `SELECT e.*, c.name as category_name 
         FROM events e
         LEFT JOIN categories c ON e.category_id = c.category_id
         WHERE e.event_id = ? AND e.organizer_id = ?`,
        [req.params.id, req.user.user_id]
      );

      if (!event.length) {
        return next(new AppError("No event found with that ID", 404));
      }

      // Get total bookings and revenue
      const [bookingStats] = await db.query(
        `SELECT 
          COUNT(*) as total_bookings,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings
         FROM bookings 
         WHERE event_id = ?`,
        [req.params.id]
      );

      // Get revenue data
      const [revenueStats] = await db.query(
        `SELECT 
          SUM(p.amount) as total_revenue,
          COUNT(DISTINCT b.user_id) as unique_customers
         FROM bookings b
         LEFT JOIN payments p ON b.booking_id = p.booking_id
         WHERE b.event_id = ? AND b.status = 'confirmed' AND p.payment_status = 'captured'`,
        [req.params.id]
      );

      // Get seat type distribution
      const [seatStats] = await db.query(
        `SELECT 
          s.seat_type,
          COUNT(*) as total_seats,
          SUM(CASE WHEN s.is_booked THEN 1 ELSE 0 END) as booked_seats
         FROM seats s
         WHERE s.event_id = ?
         GROUP BY s.seat_type`,
        [req.params.id]
      );

      // Get recent bookings
      const [recentBookings] = await db.query(
        `SELECT b.*, u.name as user_name, u.email as user_email,
          GROUP_CONCAT(s.seat_number) as booked_seats
         FROM bookings b
         JOIN users u ON b.user_id = u.user_id
         LEFT JOIN booked_seats bs ON b.booking_id = bs.booking_id
         LEFT JOIN seats s ON bs.seat_id = s.seat_id
         WHERE b.event_id = ?
         GROUP BY b.booking_id
         ORDER BY b.booking_date DESC
         LIMIT 5`,
        [req.params.id]
      );

      // Calculate booking rate
      const bookingRate =
        event[0].total_seats > 0
          ? (
              ((event[0].total_seats - event[0].available_seats) /
                event[0].total_seats) *
              100
            ).toFixed(2)
          : 0;

      res.status(200).json({
        status: "success",
        data: {
          event: event[0],
          insights: {
            bookings: {
              total: bookingStats[0].total_bookings,
              confirmed: bookingStats[0].confirmed_bookings,
              cancelled: bookingStats[0].cancelled_bookings,
              booking_rate: parseFloat(bookingRate),
            },
            revenue: {
              total: revenueStats[0].total_revenue || 0,
              unique_customers: revenueStats[0].unique_customers || 0,
              average_per_booking:
                revenueStats[0].total_revenue &&
                bookingStats[0].confirmed_bookings
                  ? (
                      revenueStats[0].total_revenue /
                      bookingStats[0].confirmed_bookings
                    ).toFixed(2)
                  : 0,
            },
            seats: {
              total: event[0].total_seats,
              available: event[0].available_seats,
              distribution: seatStats.reduce((acc, stat) => {
                acc[stat.seat_type] = {
                  total: stat.total_seats,
                  booked: stat.booked_seats,
                  available: stat.total_seats - stat.booked_seats,
                };
                return acc;
              }, {}),
            },
            recent_bookings: recentBookings,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteEvent(req, res, next) {
    try {
      // Check if event exists and belongs to this organizer
      const [event] = await db.query(
        "SELECT event_id FROM events WHERE event_id = ? AND organizer_id = ?",
        [req.params.id, req.user.user_id]
      );

      if (!event.length) {
        return next(new AppError("No event found with that ID", 404));
      }

      // Check if event has any confirmed bookings
      const [bookings] = await db.query(
        'SELECT COUNT(*) as count FROM bookings WHERE event_id = ? AND status = "confirmed"',
        [req.params.id]
      );

      if (bookings[0].count > 0) {
        return next(
          new AppError(
            "Cannot delete event with confirmed bookings. Please cancel all bookings first.",
            400
          )
        );
      }

      // Delete event (this will cascade delete related records due to foreign key constraints)
      await db.query("DELETE FROM events WHERE event_id = ?", [req.params.id]);

      res.status(200).json({
        status: "success",
        message: "Event deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CreatorController;
