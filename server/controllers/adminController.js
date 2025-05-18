const db = require("../config/db");
const AppError = require("../utils/appError");

class AdminController {
  static async getAllUsers(req, res, next) {
    try {
      const [users] = await db.query(
        "SELECT user_id, name, email, role, created_at FROM users"
      );
      res.status(200).json({
        status: "success",
        data: { users },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getUser(req, res, next) {
    try {
      const [user] = await db.query(
        "SELECT user_id, name, email, role, created_at FROM users WHERE user_id = ?",
        [req.params.id]
      );

      if (!user.length) {
        return next(new AppError("No user found with that ID", 404));
      }

      res.status(200).json({
        status: "success",
        data: { user: user[0] },
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const { name, email, role } = req.body;
      const [result] = await db.query(
        "UPDATE users SET name = ?, email = ?, role = ? WHERE user_id = ?",
        [name, email, role, req.params.id]
      );

      if (result.affectedRows === 0) {
        return next(new AppError("No user found with that ID", 404));
      }

      res.status(200).json({
        status: "success",
        message: "User updated successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAllEvents(req, res, next) {
    try {
      const [events] = await db.query(
        `SELECT 
          e.*,
          u.name as organizer_name,
          COUNT(DISTINCT b.booking_id) as total_bookings
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.user_id
        LEFT JOIN bookings b ON e.event_id = b.event_id
        GROUP BY e.event_id
        ORDER BY e.created_at DESC`
      );

      res.status(200).json({
        status: "success",
        data: { events },
      });
    } catch (err) {
      next(err);
    }
  }

  static async toggleEventStatus(req, res, next) {
    try {
      const [event] = await db.query(
        "SELECT is_active FROM events WHERE event_id = ?",
        [req.params.id]
      );

      if (!event.length) {
        return next(new AppError("No event found with that ID", 404));
      }

      const newStatus = !event[0].is_active;

      await db.query("UPDATE events SET is_active = ? WHERE event_id = ?", [
        newStatus,
        req.params.id,
      ]);

      res.status(200).json({
        status: "success",
        data: {
          is_active: newStatus,
        },
        message: `Event ${
          newStatus ? "activated" : "deactivated"
        } successfully`,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAllBookings(req, res, next) {
    try {
      const [bookings] = await db.query(
        `SELECT 
          b.*,
          u.name as user_name,
          e.title as event_title
        FROM bookings b
        JOIN users u ON b.user_id = u.user_id
        JOIN events e ON b.event_id = e.event_id
        ORDER BY b.booking_date DESC`
      );

      res.status(200).json({
        status: "success",
        data: { bookings },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getEventBookings(req, res, next) {
    try {
      const [bookings] = await db.query(
        `SELECT 
          b.*,
          u.name as user_name
        FROM bookings b
        JOIN users u ON b.user_id = u.user_id
        WHERE b.event_id = ?
        ORDER BY b.booking_date DESC`,
        [req.params.id]
      );

      res.status(200).json({
        status: "success",
        data: { bookings },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getDashboardStats(req, res, next) {
    try {
      // Get total users count
      const [usersCount] = await db.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'user'"
      );

      // Get total events count
      const [eventsCount] = await db.query(
        "SELECT COUNT(*) as count FROM events"
      );

      // Get total bookings count
      const [bookingsCount] = await db.query(
        "SELECT COUNT(*) as count FROM bookings"
      );

      // Get total revenue
      const [revenue] = await db.query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_status = 'captured'"
      );

      // Get recent bookings
      const [recentBookings] = await db.query(
        `SELECT 
          b.booking_id,
          b.booking_date,
          b.status,
          u.name as user_name,
          e.title as event_title
        FROM bookings b
        JOIN users u ON b.user_id = u.user_id
        JOIN events e ON b.event_id = e.event_id
        ORDER BY b.booking_date DESC
        LIMIT 5`
      );

      // Get upcoming events
      const [upcomingEvents] = await db.query(
        `SELECT 
          event_id,
          title,
          date,
          location,
          is_active
        FROM events
        WHERE date >= CURDATE()
        ORDER BY date ASC
        LIMIT 5`
      );

      res.status(200).json({
        status: "success",
        data: {
          stats: {
            usersCount: usersCount[0].count,
            eventsCount: eventsCount[0].count,
            bookingsCount: bookingsCount[0].count,
            totalRevenue: revenue[0].total || 0,
          },
          recentBookings,
          upcomingEvents,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdminController;
