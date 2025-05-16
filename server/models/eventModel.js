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

  static async findAll({ page = 1, limit = 10, category_id, search } = {}) {
    let query = `SELECT e.*, u.name as organizer_name, c.name as category_name 
                 FROM events e
                 LEFT JOIN users u ON e.organizer_id = u.user_id
                 LEFT JOIN categories c ON e.category_id = c.category_id
                 WHERE e.is_active = TRUE`;

    const params = [];

    if (category_id) {
      query += " AND e.category_id = ?";
      params.push(category_id);
    }

    if (search) {
      query +=
        " AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY e.date ASC, e.time ASC";

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
}

module.exports = Event;
