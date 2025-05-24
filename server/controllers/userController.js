const AppError = require("../utils/appError");
const db = require("../config/db");

class UserController {
  // Get user profile
  static async getProfile(req, res, next) {
    try {
      const [user] = await db.query(
        "SELECT user_id, name, email, phone, role FROM users WHERE user_id = ?",
        [req.user.user_id]
      );

      if (!user.length) {
        return next(new AppError("User not found", 404));
      }

      res.status(200).json({
        status: "success",
        data: {
          user: user[0],
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // Update user profile
  static async updateProfile(req, res, next) {
    try {
      const { name, phone } = req.body;
      const userId = req.user.user_id;

      const [result] = await db.query(
        "UPDATE users SET name = ?, phone = ? WHERE user_id = ?",
        [name, phone, userId]
      );

      if (result.affectedRows === 0) {
        return next(new AppError("User not found", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Profile updated successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  // Get user's bookings
  static async getUserBookings(req, res, next) {
    try {
      const [bookings] = await db.query(
        `SELECT b.*, e.title, e.date, e.time, e.location 
         FROM bookings b 
         JOIN events e ON b.event_id = e.event_id 
         WHERE b.user_id = ? 
         ORDER BY b.created_at DESC`,
        [req.user.user_id]
      );

      res.status(200).json({
        status: "success",
        data: {
          bookings,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // Get user's events (if organizer)
  static async getUserEvents(req, res, next) {
    try {
      if (req.user.role !== "organizer") {
        return next(
          new AppError("Only organizers can access their events", 403)
        );
      }

      const [events] = await db.query(
        `SELECT e.*, 
                COUNT(DISTINCT b.booking_id) as total_bookings,
                COUNT(DISTINCT w.wishlist_id) as wishlist_count
         FROM events e 
         LEFT JOIN bookings b ON e.event_id = b.event_id 
         LEFT JOIN wishlists w ON e.event_id = w.event_id
         WHERE e.organizer_id = ?
         GROUP BY e.event_id
         ORDER BY e.date DESC`,
        [req.user.user_id]
      );

      res.status(200).json({
        status: "success",
        data: {
          events,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // Get user's dashboard statistics
  static async getDashboardStats(req, res, next) {
    try {
      // Get upcoming events with details
      const [upcomingEvents] = await db.query(
        `SELECT DISTINCT e.*, b.booking_id, b.status as booking_status,
         GROUP_CONCAT(s.seat_number) as booked_seats
         FROM bookings b
         JOIN events e ON b.event_id = e.event_id
         LEFT JOIN booked_seats bs ON b.booking_id = bs.booking_id
         LEFT JOIN seats s ON bs.seat_id = s.seat_id
         WHERE b.user_id = ? 
         AND b.status = 'confirmed'
         AND (
           e.date > CURDATE() 
           OR (e.date = CURDATE() AND e.time > CURTIME())
         )
         GROUP BY b.booking_id
         ORDER BY e.date ASC, e.time ASC`,
        [req.user.user_id]
      );

      // Get total confirmed bookings count
      const [totalBookings] = await db.query(
        `SELECT COUNT(*) as count
         FROM bookings
         WHERE user_id = ? AND status = 'confirmed'`,
        [req.user.user_id]
      );

      // Get wishlist count
      const [wishlistCount] = await db.query(
        `SELECT COUNT(*) as count
         FROM wishlists
         WHERE user_id = ?`,
        [req.user.user_id]
      );

      res.status(200).json({
        status: "success",
        data: {
          stats: {
            upcomingEvents: upcomingEvents.length,
            totalBookings: totalBookings[0].count,
            wishlistCount: wishlistCount[0].count,
          },
          upcomingEvents: upcomingEvents.map((event) => ({
            ...event,
            booked_seats: event.booked_seats
              ? event.booked_seats.split(",")
              : [],
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // Get user's bookings with detailed information
  static async getMyBookings(req, res, next) {
    try {
      console.log("Getting bookings for user:", req.user.user_id);

      // First, get the basic booking information
      const [bookings] = await db.query(
        `SELECT 
          b.booking_id,
          b.status,
          b.total_amount,
          b.created_at,
          e.event_id,
          e.title,
          e.date,
          e.time,
          e.location,
          e.image_url,
          CASE 
            WHEN e.date > CURDATE() OR (e.date = CURDATE() AND e.time > CURTIME()) THEN 'upcoming'
            ELSE 'past'
          END as event_timing
         FROM bookings b 
         JOIN events e ON b.event_id = e.event_id 
         WHERE b.user_id = ? AND b.status != 'cancelled'
         ORDER BY 
           event_timing ASC,
           CASE event_timing
              CASE WHEN event_timing = 'upcoming' THEN e.date ELSE NULL END ASC,
              CASE WHEN event_timing = 'past' THEN e.date ELSE NULL END DESC,
           END,
           e.time`,
        [req.user.user_id]
      );

      console.log("Found bookings:", bookings?.length || 0);

      // If there are bookings, get the seat information for each booking
      const processedBookings = await Promise.all(
        (bookings || []).map(async (booking) => {
          try {
            const [seats] = await db.query(
              `SELECT s.seat_number, s.seat_type
               FROM booked_seats bs
               JOIN seats s ON bs.seat_id = s.seat_id
               WHERE bs.booking_id = ?`,
              [booking.booking_id]
            );

            return {
              ...booking,
              event: {
                event_id: booking.event_id,
                title: booking.title,
                date: booking.date,
                time: booking.time,
                location: booking.location,
                image_url: booking.image_url,
              },
              seats: seats || [],
              is_upcoming: booking.event_timing === "upcoming",
            };
          } catch (err) {
            console.error("Error processing booking seats:", err);
            return {
              ...booking,
              event: {
                event_id: booking.event_id,
                title: booking.title,
                date: booking.date,
                time: booking.time,
                location: booking.location,
                image_url: booking.image_url,
              },
              seats: [],
              is_upcoming: booking.event_timing === "upcoming",
            };
          }
        })
      );

      // Separate upcoming and past bookings
      const upcomingBookings = processedBookings.filter((b) => b.is_upcoming);
      const pastBookings = processedBookings.filter((b) => !b.is_upcoming);

      console.log("Processed bookings:", {
        upcoming: upcomingBookings.length,
        past: pastBookings.length,
      });

      res.status(200).json({
        status: "success",
        data: {
          upcomingBookings,
          pastBookings,
        },
      });
    } catch (err) {
      console.error("Error in getMyBookings:", err);
      next(new AppError("Failed to fetch bookings", 500));
    }
  }
}

module.exports = UserController;
