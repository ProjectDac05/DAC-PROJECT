const Wishlist = require("../models/wishlistModel");
const AppError = require("../utils/appError");

class WishlistController {
  static async addToWishlist(req, res, next) {
    try {
      const { event_id } = req.body;
      const user_id = req.user.user_id;

      const wishlistId = await Wishlist.add(user_id, event_id);

      res.status(201).json({
        status: "success",
        data: {
          wishlist_id: wishlistId,
          message: wishlistId ? "Added to wishlist" : "Already in wishlist",
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async removeFromWishlist(req, res, next) {
    try {
      const event_id = req.params.id;
      const user_id = req.user.user_id;

      const removed = await Wishlist.remove(user_id, event_id);

      if (!removed) {
        return next(new AppError("Event not found in wishlist", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Removed from wishlist",
      });
    } catch (err) {
      next(err);
    }
  }

  static async getWishlist(req, res, next) {
    try {
      const user_id = req.user.user_id;
      const wishlist = await Wishlist.getByUser(user_id);

      res.status(200).json({
        status: "success",
        results: wishlist.length,
        data: {
          wishlist,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async checkWishlist(req, res, next) {
    try {
      const event_id = req.params.id;
      const user_id = req.user.user_id;

      const isInWishlist = await Wishlist.isInWishlist(user_id, event_id);

      res.status(200).json({
        status: "success",
        data: {
          isInWishlist,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getWishlistCount(req, res, next) {
    try {
      const user_id = req.user.user_id;
      const count = await Wishlist.getWishlistCount(user_id);

      res.status(200).json({
        status: "success",
        data: {
          count,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = WishlistController;
