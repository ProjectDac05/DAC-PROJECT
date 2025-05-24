const db = require("../config/db");

class Event {
  static async create({
    title,
    description,
    short_description,
    date,
    time,
    end_date,
    end_time,
    location,
    venue_details,
    capacity,
    total_seats,
    available_seats,
    price,
    category_id,
    organizer_id,
    image_url,
  }) {
    const [result] = await db.query(
      `INSERT INTO events (
        title, description, short_description, date, time, end_date, end_time,
        location, venue_details, capacity, total_seats, available_seats, price,
        category_id, organizer_id, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        short_description,
        date,
        time,
        end_date,
        end_time,
        location,
        venue_details,
        capacity,
        total_seats,
        available_seats,
        price,
        category_id,
        organizer_id,
        image_url,
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT e.*, u.name as organizer_name, c.name as category_name 
       FROM events e
       LEFT JOIN users u ON e.organizer_id = u.user_id
       LEFT JOIN categories c ON e.category_id = c.category_id
       WHERE e.event_id = ?`,
      [id]
    );
    return rows[0];
  }
  static async findAll({
    page = 1,
    limit = 10,
    category,
    search,
    dateFrom,
    dateTo,
    minPrice,
    maxPrice,
    sortBy = "date_asc",
  } = {}) {
    let query = `SELECT e.*, u.name as organizer_name, c.name as category_name 
                 FROM events e
                 LEFT JOIN users u ON e.organizer_id = u.user_id
                 LEFT JOIN categories c ON e.category_id = c.category_id
                 WHERE e.is_active = TRUE`;

    const params = [];

    if (category) {
      query += " AND c.name = ?";
      params.push(category);
    }

    if (search) {
      query +=
        " AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (dateFrom) {
      query += " AND e.date >= ?";
      params.push(dateFrom);
    }

    if (dateTo) {
      query += " AND e.date <= ?";
      params.push(dateTo);
    }

    if (minPrice !== undefined && minPrice !== "") {
      query += " AND e.price >= ?";
      params.push(parseFloat(minPrice));
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      query += " AND e.price <= ?";
      params.push(parseFloat(maxPrice));
    }

    // Add sorting
    switch (sortBy) {
      case "date_asc":
        query += " ORDER BY e.date ASC, e.time ASC";
        break;
      case "date_desc":
        query += " ORDER BY e.date DESC, e.time DESC";
        break;
      case "price_asc":
        query += " ORDER BY e.price ASC";
        break;
      case "price_desc":
        query += " ORDER BY e.price DESC";
        break;
      default:
        query += " ORDER BY e.date ASC, e.time ASC";
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    values.push(id);
    await db.query(
      `UPDATE events SET ${fields.join(", ")} WHERE event_id = ?`,
      values
    );
    return true;
  }

  static async delete(id) {
    await db.query("UPDATE events SET is_active = FALSE WHERE event_id = ?", [
      id,
    ]);
    return true;
  }
  static async getEventSeats(eventId) {
    const [rows] = await db.query(
      `SELECT 
        s.*,
        COALESCE(MAX(
          CASE 
            WHEN bs.seat_id IS NOT NULL AND b.status = 'confirmed' THEN TRUE
            WHEN s.is_booked = TRUE THEN TRUE
            ELSE FALSE 
          END
        ), FALSE) as is_booked
       FROM seats s
       LEFT JOIN booked_seats bs ON s.seat_id = bs.seat_id
       LEFT JOIN bookings b ON bs.booking_id = b.booking_id
       WHERE s.event_id = ?
       GROUP BY 
         s.seat_id, 
         s.event_id, 
         s.seat_number, 
         s.seat_type, 
         s.price_multiplier, 
         s.is_booked, 
         s.created_at, 
         s.updated_at
       ORDER BY s.seat_number`,
      [eventId]
    );
    return rows;
  }

  static async getAvailableSeats(eventId) {
    const [rows] = await db.query(
      "SELECT * FROM seats WHERE event_id = ? AND is_booked = FALSE ORDER BY seat_number",
      [eventId]
    );
    return rows;
  }

  static async getEventImages(eventId) {
    const [rows] = await db.query(
      "SELECT * FROM event_images WHERE event_id = ? ORDER BY display_order",
      [eventId]
    );
    return rows;
  }

  static async addEventImage(eventId, imageUrl, isPrimary = false) {
    const [result] = await db.query(
      "INSERT INTO event_images (event_id, image_url, is_primary) VALUES (?, ?, ?)",
      [eventId, imageUrl, isPrimary]
    );
    return result.insertId;
  }

  static async countEventsByOrganizer(organizerId) {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM events WHERE organizer_id = ?",
      [organizerId]
    );
    return rows[0].count;
  }

  static async addSeats(eventId, seats) {
    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert all seats
      const values = seats.map((seat) => [
        eventId,
        seat.seat_number,
        seat.seat_type,
        seat.price_multiplier,
      ]);

      await connection.query(
        `INSERT INTO seats (event_id, seat_number, seat_type, price_multiplier)
         VALUES ?`,
        [values]
      );

      // Update total_seats in events table
      await connection.query(
        `UPDATE events 
         SET total_seats = ?, available_seats = ?
         WHERE event_id = ?`,
        [seats.length, seats.length, eventId]
      );

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = Event;
