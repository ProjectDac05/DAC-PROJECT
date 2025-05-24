const express = require("express");
const router = express.Router();
const EventController = require("../controllers/eventController");
const { protect } = require("../middlewares/authMiddleware");
const { validateEventData } = require("../middlewares/eventValidation");
const upload = require("../utils/multer");

router.get("/", EventController.getAllEvents);
router.get("/:id", EventController.getEvent);

// Protected routes
router.use(protect);
router.post(
  "/",
  validateEventData,
  upload.single("image"),
  EventController.createEvent
);
router.put(
  "/:id",
  validateEventData,
  upload.single("image"),
  EventController.updateEvent
);
router.delete("/:id", EventController.deleteEvent);

// Event seats
router.get("/:id/seats", EventController.getEventSeats);
router.post("/:id/seats", EventController.addSeats);

// Event images
router.post(
  "/:id/images",
  upload.single("image"),
  EventController.addEventImage
);

module.exports = router;
