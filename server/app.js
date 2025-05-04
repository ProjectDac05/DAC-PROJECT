// Import core packages
const express = require("express");
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");

// Import middlewares
const errorHandler = require("./middlewares/errorHandler");

// Initialize express app
const app = express();

// ====================
// Global Middlewares
// ====================

// Enable Cross-Origin Resource Sharing (for frontend-backend communication)
app.use(cors());

// Parse incoming JSON payloads (body parser)
app.use(express.json());

// ====================
// Route Middlewares
// ====================

// Authentication Routes (Login, Register)
app.use("/api/auth", authRoutes);

// Event Routes (Example: protected later by authMiddleware)
// To protect, uncomment and adjust as needed:
// const protect = require("./middlewares/authMiddleware");
// app.use("/api/events", protect, eventRoutes);

// Public Event Routes (currently without protection)
app.use("/api/events", eventRoutes);

// ====================
// Error Handler Middleware
// ====================

// Centralized error handling for all routes
app.use(errorHandler);

// Export app for server.js to use
module.exports = app;
