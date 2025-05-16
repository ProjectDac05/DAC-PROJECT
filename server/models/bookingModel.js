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
    const [rows] = await db.query(
      `SELECT b.*, e.title as event_title, e.date as event_date, 
       e.time as event_time, e.location as event_location, e.image_url as event_image
       FROM bookings b
       JOIN events e ON b.event_id = e.event_id
       WHERE b.user_id = ? AND b.status != 'cancelled'
       ORDER BY b.booking_date DESC`,
      [userId]
    );
    return rows;
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

  static async createPayment(
    booking_id,
    amount,
    payment_method,
    transaction_id
  ) {
    const [result] = await db.query(
      `INSERT INTO payments (
        booking_id, amount, payment_method, transaction_id, payment_status, currency
      ) VALUES (?, ?, ?, ?, 'captured', 'INR')`,
      [booking_id, amount, payment_method, transaction_id]
    );
    return result.insertId;
  }
}

module.exports = Booking;
