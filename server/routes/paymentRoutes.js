const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/paymentController");
const {
  protect,
  isBookingOwnerOrAdmin,
} = require("../middlewares/authMiddleware");

// Protected routes
router.post("/create-intent", protect, PaymentController.createPaymentIntent);
router.post("/confirm", protect, PaymentController.confirmPayment);
router.get(
  "/:id",
  protect,
  isBookingOwnerOrAdmin,
  PaymentController.getPayment
);

// Webhook (no protection as it's called by payment provider)
router.post("/webhook", PaymentController.handleWebhook);

module.exports = router;
