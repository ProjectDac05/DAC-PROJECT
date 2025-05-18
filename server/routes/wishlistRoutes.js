const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const wishlistController = require("../controllers/wishlistController");

// Get user's wishlist
router.get("/user", protect, wishlistController.getUserWishlist);

// Add event to wishlist
router.post("/:eventId", protect, wishlistController.addToWishlist);

// Remove event from wishlist
router.delete("/:eventId", protect, wishlistController.removeFromWishlist);

module.exports = router;
