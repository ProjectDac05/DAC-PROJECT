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

// Protect all routes and restrict to admin
router.use(protect, restrictTo("admin"));

// Dashboard
router.get("/dashboard", AdminController.getDashboardStats);

// User management
router.get("/users", AdminController.getAllUsers);
router.post("/users", AdminController.createUser);
router.get("/users/:id", AdminController.getUser);
router.patch("/users/:id", AdminController.updateUser);
router.delete("/users/:id", AdminController.deleteUser);

// Event management
router.get("/events", AdminController.getAllEvents);
router.patch("/events/:id/toggle-status", AdminController.toggleEventStatus);

// Booking management
router.get("/bookings", AdminController.getAllBookings);
router.get("/events/:id/bookings", AdminController.getEventBookings);
router.patch("/bookings/:id/status", AdminController.updateBookingStatus);

// Category management
router.get("/categories", AdminController.getAllCategories);
router.post("/categories", AdminController.createCategory);
router.get("/categories/:id", AdminController.getCategory);
router.patch("/categories/:id", AdminController.updateCategory);
router.delete("/categories/:id", AdminController.deleteCategory);
router.patch(
  "/categories/:id/toggle-status",
  AdminController.toggleCategoryStatus
);

// Reports
router.get("/reports", AdminController.getReports);

module.exports = router;
