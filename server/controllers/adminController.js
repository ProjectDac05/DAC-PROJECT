const User = require("../models/userModel");
const Event = require("../models/eventModel");
const Booking = require("../models/bookingModel");
const AppError = require("../utils/appError");

class AdminController {
  static async getAllUsers(req, res, next) {
    try {
      const [users] = await req.db.query(
        "SELECT user_id, name, email, phone, role, is_active, created_at FROM users"
      );

      res.status(200).json({
        status: "success",
        results: users.length,
        data: {
          users,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getUser(req, res, next) {
    try {
      const [rows] = await req.db.query(
        "SELECT user_id, name, email, phone, role, is_active, created_at FROM users WHERE user_id = ?",
        [req.params.id]
      );

      if (!rows.length) {
        return next(new AppError("No user found with that ID", 404));
      }

      res.status(200).json({
        status: "success",
        data: {
          user: rows[0],
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const { role, is_active } = req.body;

      // Only allow updating role and active status
      const allowedUpdates = { role, is_active };

      await req.db.query(
        "UPDATE users SET role = ?, is_active = ? WHERE user_id = ?",
        [allowedUpdates.role, allowedUpdates.is_active, req.params.id]
      );

      const [rows] = await req.db.query(
        "SELECT user_id, name, email, phone, role, is_active, created_at FROM users WHERE user_id = ?",
        [req.params.id]
      );

      res.status(200).json({
        status: "success",
        data: {
          user: rows[0],
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAllEvents(req, res, next) {
    try {
      const [events] = await req.db.query(
        `SELECT e.*, u.name as organizer_name, c.name as category_name 
         FROM events e
         LEFT JOIN users u ON e.organizer_id = u.user_id
         LEFT JOIN categories c ON e.category_id = c.category_id
         ORDER BY e.created_at DESC`
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

  static async toggleEventStatus(req, res, next) {
    try {
      // Check if event exists
      const [rows] = await req.db.query(
        "SELECT event_id, is_active FROM events WHERE event_id = ?",
        [req.params.id]
      );

      if (!rows.length) {
        return next(new AppError("No event found with that ID", 404));
      }

      // Toggle is_active status
      await req.db.query("UPDATE events SET is_active = ? WHERE event_id = ?", [
        !rows[0].is_active,
        req.params.id,
      ]);

      res.status(200).json({
        status: "success",
        message: `Event ${
          !rows[0].is_active ? "activated" : "deactivated"
        } successfully`,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAllBookings(req, res, next) {
    try {
      const [bookings] = await req.db.query(
        `SELECT b.*, e.title as event_title, u.name as user_name, u.email as user_email
         FROM bookings b
         JOIN events e ON b.event_id = e.event_id
         JOIN users u ON b.user_id = u.user_id
         ORDER BY b.booking_date DESC`
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

  static async getEventBookings(req, res, next) {
    try {
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

  static async getDashboardStats(req, res, next) {
    try {
      // Get total users
      const [usersCount] = await req.db.query(
        "SELECT COUNT(*) as count FROM users"
      );

      // Get total events
      const [eventsCount] = await req.db.query(
        "SELECT COUNT(*) as count FROM events"
      );

      // Get total bookings
      const [bookingsCount] = await req.db.query(
        "SELECT COUNT(*) as count FROM bookings"
      );

      // Get total revenue
      const [revenue] = await req.db.query(
        'SELECT SUM(amount) as total FROM payments WHERE payment_status = "captured"'
      );

      // Get recent bookings
      const [recentBookings] = await req.db.query(
        `SELECT b.booking_id, b.booking_date, b.total_amount, 
                e.title as event_title, u.name as user_name
         FROM bookings b
         JOIN events e ON b.event_id = e.event_id
         JOIN users u ON b.user_id = u.user_id
         ORDER BY b.booking_date DESC
         LIMIT 5`
      );

      res.status(200).json({
        status: "success",
        data: {
          stats: {
            users: usersCount[0].count,
            events: eventsCount[0].count,
            bookings: bookingsCount[0].count,
            revenue: revenue[0].total || 0,
          },
          recentBookings,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdminController;
