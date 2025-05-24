const db = require("../config/db");

class Booking {
  static async create({ event_id, user_id, total_amount }) {
    const [result] = await db.query(
      "INSERT INTO bookings (event_id, user_id, total_amount, status) VALUES (?, ?, ?, 'confirmed')",
      [event_id, user_id, total_amount]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT b.*, e.title as event_title, e.date as event_date, 
       e.time as event_time, e.location as event_location,
       u.name as user_name, u.email as user_email
       FROM bookings b
       JOIN events e ON b.event_id = e.event_id
       JOIN users u ON b.user_id = u.user_id
       WHERE b.booking_id = ?`,
      [id]
    );
    return rows[0];
  }
  static async findByUser(userId) {
    try {
      console.log("Finding bookings for user:", userId); // First log the raw query      // First, let's check if the user has any bookings at all
      const [bookingCheck] = await db.query(
        "SELECT booking_id, status FROM bookings WHERE user_id = ?",
        [userId]
      );
      console.log("All bookings for user:", bookingCheck);

      const query = `
        SELECT 
          b.booking_id,
          b.total_amount,
          b.status,
          b.booking_date,
          e.event_id,
          e.title,
          DATE_FORMAT(e.date, '%Y-%m-%d') as date,
          TIME_FORMAT(e.time, '%H:%i:%s') as time,
          e.location,
          e.image_url
         FROM bookings b
         LEFT JOIN events e ON b.event_id = e.event_id
         WHERE b.user_id = ?
         ORDER BY COALESCE(e.date, CURDATE()) ASC, COALESCE(e.time, CURTIME()) ASC`;

      console.log("Executing query:", query);
      console.log("With userId:", userId);

      const [rows] = await db.query(query, [userId]);

      console.log("Raw database results:", rows);
      console.log("Raw booking rows:", rows);

      // Get seats for each booking
      const bookingsWithSeats = await Promise.all(
        rows.map(async (booking) => {
          try {
            console.log(`Fetching seats for booking ${booking.booking_id}`);

            // First verify the booking exists
            const [bookingCheck] = await db.query(
              "SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_id = ?) as exists_check",
              [booking.booking_id]
            );

            if (!bookingCheck[0].exists_check) {
              console.log(
                `Booking ${booking.booking_id} not found in database`
              );
              return null;
            }

            const [seats] = await db.query(
              `SELECT s.seat_id, s.seat_number, bs.price_paid as price
               FROM seats s
               JOIN booked_seats bs ON s.seat_id = bs.seat_id
               WHERE bs.booking_id = ?`,
              [booking.booking_id]
            );

            console.log(
              `Found ${seats.length} seats for booking ${booking.booking_id}:`,
              seats
            );

            // Format the booking data
            return {
              booking_id: booking.booking_id,
              total_amount: booking.total_amount,
              status: booking.status,
              booking_date: booking.booking_date,
              event: {
                id: booking.event_id,
                title: booking.title,
                date: booking.date, // Already formatted by MySQL
                time: booking.time, // Already formatted by MySQL
                location: booking.location,
                image_url: booking.image_url,
              },
              seats: seats || [],
            };
          } catch (err) {
            console.error(
              `Error processing booking ${booking.booking_id}:`,
              err
            );
            return null;
          }
        })
      ); // Filter out any failed bookings and sort by date
      const validBookings = bookingsWithSeats
        .filter((booking) => booking !== null)
        .sort((a, b) => {
          const dateA = new Date(`${a.event.date} ${a.event.time}`);
          const dateB = new Date(`${b.event.date} ${b.event.time}`);
          return dateA - dateB;
        });

      console.log(
        "Processed bookings:",
        JSON.stringify(validBookings, null, 2)
      );
      return validBookings;
    } catch (error) {
      console.error("Error in findByUser:", error);
      console.error("Error stack:", error.stack);
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }
  }

  static async findByEvent(eventId) {
    const [rows] = await db.query(
      `SELECT b.*, u.name as user_name, u.email as user_email
       FROM bookings b
       JOIN users u ON b.user_id = u.user_id
       WHERE b.event_id = ? AND b.status = 'confirmed'
       ORDER BY b.booking_date DESC`,
      [eventId]
    );
    return rows;
  }

  static async bookSeats(bookingId, seatIds) {
    // First get the price for each seat
    const [seats] = await db.query(
      `SELECT s.seat_id, e.price * s.price_multiplier as price_paid
       FROM seats s
       JOIN events e ON s.event_id = e.event_id
       WHERE s.seat_id IN (?) AND s.is_booked = FALSE`,
      [seatIds]
    );

    // Check if all seats are available
    if (seats.length !== seatIds.length) {
      throw new Error("Some selected seats are not available");
    }

    // Insert booked seats
    const values = seats.map((seat) => [
      bookingId,
      seat.seat_id,
      seat.price_paid,
    ]);

    await db.query(
      "INSERT INTO booked_seats (booking_id, seat_id, price_paid) VALUES ?",
      [values]
    );

    // Mark seats as booked
    await db.query("UPDATE seats SET is_booked = TRUE WHERE seat_id IN (?)", [
      seatIds,
    ]);

    return true;
  }

  static async getBookedSeats(bookingId) {
    const [rows] = await db.query(
      `SELECT bs.*, s.seat_number, s.seat_type
       FROM booked_seats bs
       JOIN seats s ON bs.seat_id = s.seat_id
       WHERE bs.booking_id = ?`,
      [bookingId]
    );
    return rows;
  }

  static async getPaymentDetails(bookingId) {
    const [rows] = await db.query(
      "SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1",
      [bookingId]
    );
    return rows[0];
  }

  static async updateStatus(bookingId, status) {
    await db.query("UPDATE bookings SET status = ? WHERE booking_id = ?", [
      status,
      bookingId,
    ]);
    return true;
  }

  static async createPayment({
    booking_id,
    amount,
    payment_method,
    transaction_id,
    payment_status,
  }) {
    try {
      const [result] = await db.query(
        `INSERT INTO payments (booking_id, amount, payment_method, transaction_id, payment_status) 
         VALUES (?, ?, ?, ?, ?)`,
        [booking_id, amount, payment_method, transaction_id, payment_status]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  }
}

module.exports = Booking;
