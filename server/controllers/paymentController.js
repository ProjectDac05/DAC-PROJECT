const Booking = require("../models/bookingModel");
const AppError = require("../utils/appError");

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

      // In a real app, you would create a payment intent with Stripe, Razorpay, etc.
      // Here we'll just simulate it and return a mock client secret

      res.status(200).json({
        status: "success",
        data: {
          clientSecret:
            "pi_mock_" + Math.random().toString(36).substring(2, 15),
          amount: booking.total_amount,
          currency: "INR",
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async confirmPayment(req, res, next) {
    try {
      const { booking_id, payment_method, transaction_id } = req.body;

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

      // 3) Check if booking is already paid
      const existingPayment = await Booking.getPaymentDetails(booking_id);
      if (existingPayment && existingPayment.payment_status === "captured") {
        return next(new AppError("Booking is already paid", 400));
      }

      // 4) Confirm the payment (in a real app, you would verify with payment provider)
      // Here we'll just simulate it

      // 5) Create payment record
      const paymentId = await Booking.createPayment(
        booking_id,
        booking.total_amount,
        payment_method,
        transaction_id
      );

      // 6) Update booking status to confirmed
      await Booking.updateStatus(booking_id, "confirmed");

      // 7) Get updated booking details
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
      // In a real app, you would:
      // 1) Verify the webhook signature
      // 2) Parse the event
      // 3) Update the payment status in your database
      // 4) Update the booking status if payment is successful

      // This is just a placeholder
      console.log("Webhook received:", req.body);

      res.status(200).json({
        status: "success",
        message: "Webhook received",
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PaymentController;
