const db = require("../config/db");
const AppError = require("../utils/appError");
const logger = require("../utils/logger");

exports.getUserWishlist = async (req, res, next) => {
  try {
    const [wishlist] = await db.query(
      `SELECT w.*, e.title, e.date, e.time, e.location, e.price, e.image_url
       FROM wishlists w
       JOIN events e ON w.event_id = e.event_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [req.user.user_id]
    );

    res.status(200).json({
      status: "success",
      data: {
        wishlist,
      },
    });
  } catch (error) {
    logger.error("Error fetching user wishlist:", error);
    next(new AppError("Failed to fetch wishlist", 500));
  }
};

exports.addToWishlist = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check if event exists
    const [event] = await connection.query(
      "SELECT event_id FROM events WHERE event_id = ?",
      [req.params.eventId]
    );

    if (!event.length) {
      throw new AppError("Event not found", 404);
    }

    // Check if already in wishlist
    const [existing] = await connection.query(
      "SELECT wishlist_id FROM wishlists WHERE user_id = ? AND event_id = ?",
      [req.user.user_id, req.params.eventId]
    );

    if (existing.length) {
      throw new AppError("Event already in wishlist", 400);
    }

    // Add to wishlist
    await connection.query(
      "INSERT INTO wishlists (user_id, event_id) VALUES (?, ?)",
      [req.user.user_id, req.params.eventId]
    );

    await connection.commit();

    res.status(201).json({
      status: "success",
      message: "Added to wishlist",
    });
  } catch (error) {
    await connection.rollback();
    logger.error("Error adding to wishlist:", error);
    next(error);
  } finally {
    connection.release();
  }
};

exports.removeFromWishlist = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Remove from wishlist
    const [result] = await connection.query(
      "DELETE FROM wishlists WHERE user_id = ? AND event_id = ?",
      [req.user.user_id, req.params.eventId]
    );

    if (result.affectedRows === 0) {
      throw new AppError("Event not found in wishlist", 404);
    }

    await connection.commit();

    res.status(200).json({
      status: "success",
      message: "Removed from wishlist",
    });
  } catch (error) {
    await connection.rollback();
    logger.error("Error removing from wishlist:", error);
    next(error);
  } finally {
    connection.release();
  }
};
