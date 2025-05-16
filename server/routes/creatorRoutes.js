const express = require("express");
const router = express.Router();
const CreatorController = require("../controllers/creatorController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

// Protect all routes and restrict to organizers
router.use(protect, restrictTo("organizer"));

// Event management
router.get("/events", CreatorController.getMyEvents);
router.get("/events/:id", CreatorController.getEventDetails);
router.get("/events/:id/bookings", CreatorController.getEventBookings);
router.get("/events/:id/stats", CreatorController.getEventStats);

// Seat management
router.post("/events/:id/seats", CreatorController.addSeats);

module.exports = router;
