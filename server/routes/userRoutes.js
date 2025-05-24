const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

// Protect all routes
router.use(protect);

// User dashboard stats
router.get("/stats", UserController.getDashboardStats);

// User bookings
router.get("/bookings", UserController.getMyBookings);

module.exports = router;
