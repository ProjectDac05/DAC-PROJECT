const Booking = require("../models/bookingModel");
const AppError = require("../utils/appError");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class PaymentController {
  static async createPaymentIntent(req, res, next) {
    try {
      const { booking_id } = req.body;

      // 1) Check if booking exists
      const booking = await Booking.findById(booking_id);
      if (!booking) {
        return next(new AppError("No booking found with that ID", 404));
      }

      // 2) Check if user is the owner
      if (booking.user_id !== req.user.user_id) {
        return next(
          new AppError("You are not authorized to pay for this booking", 403)
        );
      }

      // 3) Check if booking is already paid
      const existingPayment = await Booking.getPaymentDetails(booking_id);
      if (existingPayment && existingPayment.payment_status === "captured") {
        return next(new AppError("Booking is already paid", 400));
      }

      // 4) Create Razorpay order
      const options = {
        amount: Math.round(booking.total_amount * 100), // amount in smallest currency unit (paise)
        currency: "INR",
        receipt: `booking_${booking_id}`,
        notes: {
          booking_id: booking_id,
          user_id: req.user.user_id,
        },
      };

      const order = await razorpay.orders.create(options);

      res.status(200).json({
        status: "success",
        data: {
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          key: process.env.RAZORPAY_KEY_ID,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async confirmPayment(req, res, next) {
    try {
      const {
        booking_id,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      } = req.body;

      // 1) Check if booking exists
      const booking = await Booking.findById(booking_id);
      if (!booking) {
        return next(new AppError("No booking found with that ID", 404));
      }

      // 2) Check if user is the owner
      if (booking.user_id !== req.user.user_id) {
        return next(
          new AppError(
            "You are not authorized to confirm payment for this booking",
            403
          )
        );
      }

      // 3) Verify payment signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return next(new AppError("Invalid payment signature", 400));
      }

      // 4) Create payment record
      const paymentId = await Booking.createPayment({
        booking_id,
        amount: booking.total_amount,
        payment_method: "razorpay",
        transaction_id: razorpay_payment_id,
        payment_status: "captured",
      });

      // 5) Update booking status to confirmed
      await Booking.updateStatus(booking_id, "confirmed");

      // 6) Get updated booking details
      const updatedBooking = await Booking.findById(booking_id);

      res.status(200).json({
        status: "success",
        data: {
          booking: updatedBooking,
          paymentId,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPayment(req, res, next) {
    try {
      const payment = await Booking.getPaymentDetails(req.params.id);

      if (!payment) {
        return next(new AppError("No payment found for this booking", 404));
      }

      // Get booking details
      const booking = await Booking.findById(req.params.id);

      // Check if user is the owner or admin
      if (booking.user_id !== req.user.user_id && req.user.role !== "admin") {
        return next(
          new AppError("You are not authorized to view this payment", 403)
        );
      }

      res.status(200).json({
        status: "success",
        data: {
          payment,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async handleWebhook(req, res, next) {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const shasum = crypto.createHmac("sha256", secret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest("hex");

      // Verify webhook signature
      if (digest === req.headers["x-razorpay-signature"]) {
        const { payload } = req.body;
        const { payment } = payload.payment.entity;

        // Update payment status
        if (payment.status === "captured") {
          const booking_id = payment.notes.booking_id;
          await Booking.updateStatus(booking_id, "confirmed");
        }
      }

      res.status(200).json({
        status: "success",
        message: "Webhook processed successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PaymentController;
