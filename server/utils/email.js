const nodemailer = require("nodemailer");
const AppError = require("./appError");

// Create a transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send welcome email
exports.sendWelcomeEmail = async (user) => {
  try {
    const mailOptions = {
      from: `"Event Booking System" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: "Welcome to Event Booking System!",
      text: `Hi ${user.name},\n\nWelcome to Event Booking System! We're excited to have you on board.\n\nBest regards,\nEvent Booking Team`,
      html: `<p>Hi ${user.name},</p><p>Welcome to Event Booking System! We're excited to have you on board.</p><p>Best regards,<br>Event Booking Team</p>`,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Error sending welcome email:", err);
  }
};

// Send password reset email
exports.sendPasswordResetEmail = async (user, resetUrl) => {
  try {
    const mailOptions = {
      from: `"Event Booking System" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: "Your password reset token (valid for 10 minutes)",
      text: `Hi ${user.name},\n\nForgot your password? Submit a PATCH request with your new password to: ${resetUrl}\n\nIf you didn't forget your password, please ignore this email.\n\nBest regards,\nEvent Booking Team`,
      html: `<p>Hi ${user.name},</p><p>Forgot your password? Click <a href="${resetUrl}">here</a> to reset your password.</p><p>If you didn't forget your password, please ignore this email.</p><p>Best regards,<br>Event Booking Team</p>`,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Error sending password reset email:", err);
    throw new AppError(
      "There was an error sending the email. Try again later!",
      500
    );
  }
};

// Send booking confirmation email
exports.sendBookingConfirmation = async (user, booking) => {
  try {
    const mailOptions = {
      from: `"Event Booking System" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: `Your booking confirmation for ${booking.event_title}`,
      text: `Hi ${user.name},\n\nThank you for your booking for ${booking.event_title} on ${booking.event_date}.\n\nBooking ID: ${booking.booking_id}\nTotal Amount: ${booking.total_amount}\n\nBest regards,\nEvent Booking Team`,
      html: `<p>Hi ${user.name},</p><p>Thank you for your booking for <strong>${booking.event_title}</strong> on ${booking.event_date}.</p><p>Booking ID: ${booking.booking_id}<br>Total Amount: ${booking.total_amount}</p><p>Best regards,<br>Event Booking Team</p>`,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Error sending booking confirmation email:", err);
  }
};
