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
    // Handle null values for optional date fields
    const formattedEndDate = end_date || null;
    const formattedEndTime = end_time || null;

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
        formattedEndDate,
        formattedEndTime,
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
    sortBy = "date_asc",
    minPrice,
    maxPrice,
  } = {}) {
    let query = `SELECT e.*, u.name as organizer_name, c.name as category_name 
                 FROM events e
                 LEFT JOIN users u ON e.organizer_id = u.user_id
                 LEFT JOIN categories c ON e.category_id = c.category_id
                 WHERE e.is_active = TRUE`;

    const params = [];

    // Category filter
    if (category) {
      query += " AND c.name = ?";
      params.push(category);
    }

    // Search filter
    if (search) {
      query +=
        " AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Date range filter
    if (dateFrom) {
      query += " AND e.date >= ?";
      params.push(dateFrom);
    }
    if (dateTo) {
      query += " AND e.date <= ?";
      params.push(dateTo);
    }

    // Price range filter
    if (minPrice !== undefined) {
      query += " AND e.price >= ?";
      params.push(minPrice);
    }
    if (maxPrice !== undefined) {
      query += " AND e.price <= ?";
      params.push(maxPrice);
    }

    // Sorting
    switch (sortBy) {
      case "date_desc":
        query += " ORDER BY e.date DESC, e.time DESC";
        break;
      case "price_asc":
        query += " ORDER BY e.price ASC, e.date ASC";
        break;
      case "price_desc":
        query += " ORDER BY e.price DESC, e.date ASC";
        break;
      default: // date_asc
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
      "SELECT * FROM seats WHERE event_id = ? ORDER BY seat_number",
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

  static async addSeats(eventId, seatValues) {
    // First, delete any existing seats for this event
    await db.query("DELETE FROM seats WHERE event_id = ?", [eventId]);

    // Insert new seats
    await db.query(
      "INSERT INTO seats (event_id, seat_number, seat_type, price_multiplier) VALUES ?",
      [seatValues]
    );

    // Update total seats count in events table
    const [result] = await db.query(
      "SELECT COUNT(*) as count FROM seats WHERE event_id = ?",
      [eventId]
    );

    await db.query(
      "UPDATE events SET total_seats = ?, available_seats = ? WHERE event_id = ?",
      [result[0].count, result[0].count, eventId]
    );

    return true;
  }
}

module.exports = Event;
