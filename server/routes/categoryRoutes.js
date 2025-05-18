const express = require("express");
const router = express.Router();
const CategoryController = require("../controllers/categoryController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

// Public routes
router.get("/", CategoryController.getAllCategories);
router.get("/:id", CategoryController.getCategory);

// Protected admin routes
router.use(protect, restrictTo("admin"));
router.post("/", CategoryController.createCategory);
router.patch("/:id", CategoryController.updateCategory);
router.delete("/:id", CategoryController.deleteCategory);

module.exports = router;
