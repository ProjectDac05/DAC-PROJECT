const express = require("express");
const router = express.Router();
const BookingController = require("../controllers/bookingController");
const {
  protect,
  isBookingOwnerOrAdmin,
} = require("../middlewares/authMiddleware");

// Protected routes
router.post("/", protect, BookingController.createBooking);
router.get("/my-bookings", protect, BookingController.getUserBookings);
router.get(
  "/:id",
  protect,
  isBookingOwnerOrAdmin,
  BookingController.getBooking
);
router.patch(
  "/:id/cancel",
  protect,
  isBookingOwnerOrAdmin,
  BookingController.cancelBooking
);
router.post("/:id/confirm", protect, BookingController.confirmBooking);

module.exports = router;
