const express = require("express");
const router = express.Router();
const WishlistController = require("../controllers/wishlistController");
const { protect } = require("../middlewares/authMiddleware");

// All routes are protected and require authentication
router.use(protect);

// Add to wishlist
router.post("/", WishlistController.addToWishlist);

// Remove from wishlist
router.delete("/:id", WishlistController.removeFromWishlist);

// Get user's wishlist
router.get("/", WishlistController.getWishlist);

// Check if event is in user's wishlist
router.get("/check/:id", WishlistController.checkWishlist);

// Get user's wishlist count
router.get("/count", WishlistController.getWishlistCount);

module.exports = router;
