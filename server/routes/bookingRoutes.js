const express = require("express");
const router = express.Router();
const BookingController = require("../controllers/bookingController");
const {
  protect,
  isBookingOwnerOrAdmin,
} = require("../middlewares/authMiddleware");
const {
  bookingValidationRules,
  idParamValidation,
  validate,
} = require("../middlewares/validationMiddleware");
const { cacheMiddleware } = require("../middlewares/cacheMiddleware");

// Protected routes
router.post(
  "/",
  protect,
  bookingValidationRules,
  validate,
  BookingController.createBooking
);
router.get(
  "/user/bookings",
  protect,
  cacheMiddleware(2 * 60 * 1000),
  BookingController.getUserBookings
);
router.get(
  "/:id",
  protect,
  idParamValidation,
  validate,
  isBookingOwnerOrAdmin,
  cacheMiddleware(5 * 60 * 1000), // Cache for 5 minutes
  BookingController.getBooking
);
router.patch(
  "/:id/cancel",
  protect,
  idParamValidation,
  validate,
  isBookingOwnerOrAdmin,
  BookingController.cancelBooking
);
router.patch(
  "/:id/confirm",
  protect,
  idParamValidation,
  validate,
  isBookingOwnerOrAdmin,
  BookingController.confirmBooking
);

module.exports = router;
