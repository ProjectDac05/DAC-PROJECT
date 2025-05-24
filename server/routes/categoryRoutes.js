const express = require("express");
const router = express.Router();
const Category = require("../models/categoryModel");

// Get all active categories
router.get("/", async (req, res, next) => {
  try {
    const categories = await Category.findAll();
    res.status(200).json({
      status: "success",
      data: {
        categories,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
