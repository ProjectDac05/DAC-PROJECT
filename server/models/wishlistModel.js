const db = require("../config/db");

class Wishlist {
  static async add(userId, eventId) {
    try {
      const [result] = await db.query(
        "INSERT INTO wishlists (user_id, event_id) VALUES (?, ?)",
        [userId, eventId]
      );
      return result.insertId;
    } catch (err) {
      // If duplicate entry error, ignore it
      if (err.code === "ER_DUP_ENTRY") {
        return null;
      }
      throw err;
    }
  }

  static async remove(userId, eventId) {
    const [result] = await db.query(
      "DELETE FROM wishlists WHERE user_id = ? AND event_id = ?",
      [userId, eventId]
    );
    return result.affectedRows > 0;
  }

  static async getByUser(userId) {
    const [rows] = await db.query(
      `SELECT w.*, e.title, e.date, e.time, e.location, e.price, e.image_url,
              e.available_seats, e.total_seats
       FROM wishlists w
       JOIN events e ON w.event_id = e.event_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async isInWishlist(userId, eventId) {
    const [rows] = await db.query(
      "SELECT wishlist_id FROM wishlists WHERE user_id = ? AND event_id = ?",
      [userId, eventId]
    );
    return rows.length > 0;
  }

  static async getWishlistCount(userId) {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM wishlists WHERE user_id = ?",
      [userId]
    );
    return rows[0].count;
  }
}

module.exports = Wishlist;
