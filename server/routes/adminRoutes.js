const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/adminController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");
const User = require("../models/userModel");
const Category = require("../models/categoryModel");

// Quick setup routes (remove in production)
router.post("/setup", async (req, res) => {
  try {
    await User.updateRole(req.body.userId, req.body.role);
    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/setup-category", async (req, res) => {
  try {
    const categoryId = await Category.create({
      name: req.body.name,
      description: req.body.description,
      image_url: req.body.image_url,
    });
    res.json({ status: "success", categoryId });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Protect all routes after this middleware
router.use(protect);

// Restrict to admin only after this middleware
router.use(restrictTo("admin"));

// User management
router.get("/users", AdminController.getAllUsers);
router.get("/users/:id", AdminController.getUser);
router.patch("/users/:id", AdminController.updateUser);

// Event management
router.get("/events", AdminController.getAllEvents);
router.patch("/events/:id/toggle-status", AdminController.toggleEventStatus);

// Booking management
router.get("/bookings", AdminController.getAllBookings);
router.get("/events/:id/bookings", AdminController.getEventBookings);

// Dashboard
router.get("/dashboard", AdminController.getDashboardStats);

module.exports = router;
