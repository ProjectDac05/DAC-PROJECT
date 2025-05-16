require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const path = require("path");

// Import routes
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const creatorRoutes = require("./routes/creatorRoutes");

// Import middlewares
const errorHandler = require("./middlewares/errorHandler");
const dbMiddleware = require("./middlewares/dbMiddleware");

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Initialize express app
const app = express();

// ====================
// Security Middlewares
// ====================

// Set security HTTP headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
});
app.use("/api", limiter);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// ====================
// Global Middlewares
// ====================

// Enable Cross-Origin Resource Sharing
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? process.env.ALLOWED_ORIGINS?.split(",") || []
    : [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ];

app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        !process.env.NODE_ENV ||
        process.env.NODE_ENV === "development"
      ) {
        return callback(null, true);
      }
      if (allowedOrigins.indexOf(origin) === -1) {
        console.warn(`⚠️  Blocked request from unauthorized origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  })
);

// Serve static files
app.use("/public", express.static(path.join(__dirname, "public")));

// Parse JSON bodies with increased limit for file uploads
app.use(express.json({ limit: "10kb" }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Add request time
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Add database middleware
app.use(dbMiddleware);

// ====================
// Route Middlewares
// ====================

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: req.requestTime,
  });
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// Event Routes
app.use("/api/events", eventRoutes);

// Booking Routes
app.use("/api/bookings", bookingRoutes);

// Payment Routes
app.use("/api/payments", paymentRoutes);

// Admin Routes
app.use("/api/admin", adminRoutes);

// Creator Routes
app.use("/api/creator", creatorRoutes);

// Handle 404 routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error Handler
app.use(errorHandler);

// Export app for server.js to use
module.exports = app;
