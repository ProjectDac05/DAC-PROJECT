const express = require("express");
const router = express.Router();
const EventController = require("../controllers/eventController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../utils/multer");

router.get("/", EventController.getAllEvents);
router.get("/:id", EventController.getEvent);

// Protected routes
router.post("/", protect, upload.single("image"), EventController.createEvent);
router.patch("/:id", protect, EventController.updateEvent);
router.delete("/:id", protect, EventController.deleteEvent);

// Event seats
router.get("/:id/seats", EventController.getEventSeats);

// Event images
router.post(
  "/:id/images",
  protect,
  upload.single("image"),
  EventController.addEventImage
);

module.exports = router;
