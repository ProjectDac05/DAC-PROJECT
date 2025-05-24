const Event = require("../models/eventModel");
const Category = require("../models/categoryModel");
const AppError = require("../utils/appError");

class EventController {
  static async getAllEvents(req, res, next) {
    try {
      const {
        search,
        category,
        dateFrom,
        dateTo,
        sortBy,
        minPrice,
        maxPrice,
        page = 1,
        limit = 10,
      } = req.query;

      console.log("Search parameters:", {
        search,
        category,
        dateFrom,
        dateTo,
        sortBy,
        minPrice,
        maxPrice,
        page,
        limit,
      });

      const events = await Event.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        category,
        dateFrom,
        dateTo,
        sortBy,
        minPrice,
        maxPrice,
      });

      res.status(200).json({
        status: "success",
        results: events.length,
        data: {
          events,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getEvent(req, res, next) {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return next(new AppError("No event found with that ID", 404));
      }

      // Get event images
      const images = await Event.getEventImages(req.params.id);

      // Get available seats
      const seats = await Event.getAvailableSeats(req.params.id);

      res.status(200).json({
        status: "success",
        data: {
          event: {
            ...event,
            images,
            available_seats: seats,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async createEvent(req, res, next) {
    try {
      // Check if category exists
      if (req.body.category_id) {
        const category = await Category.findById(req.body.category_id);
        if (!category) {
          return next(new AppError("No category found with that ID", 404));
        }
      }

      // Set organizer to current user
      req.body.organizer_id = req.user.user_id;

      // Set available seats to total seats initially
      req.body.available_seats = req.body.total_seats;

      const eventId = await Event.create(req.body);
      const event = await Event.findById(eventId);

      res.status(201).json({
        status: "success",
        data: {
          event,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateEvent(req, res, next) {
    try {
      // Check if event exists
      const event = await Event.findById(req.params.id);
      if (!event) {
        return next(new AppError("No event found with that ID", 404));
      }

      // Check if user is the organizer or admin
      if (
        event.organizer_id !== req.user.user_id &&
        req.user.role !== "admin"
      ) {
        return next(
          new AppError("You are not authorized to update this event", 403)
        );
      }

      // Check if category exists
      if (req.body.category_id) {
        const category = await Category.findById(req.body.category_id);
        if (!category) {
          return next(new AppError("No category found with that ID", 404));
        }
      }

      // Update event
      await Event.update(req.params.id, req.body);
      const updatedEvent = await Event.findById(req.params.id);

      res.status(200).json({
        status: "success",
        data: {
          event: updatedEvent,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteEvent(req, res, next) {
    try {
      // Check if event exists
      const event = await Event.findById(req.params.id);
      if (!event) {
        return next(new AppError("No event found with that ID", 404));
      }

      // Check if user is the organizer or admin
      if (
        event.organizer_id !== req.user.user_id &&
        req.user.role !== "admin"
      ) {
        return next(
          new AppError("You are not authorized to delete this event", 403)
        );
      }

      // Soft delete the event
      await Event.delete(req.params.id);

      res.status(204).json({
        status: "success",
        data: null,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getEventSeats(req, res, next) {
    try {
      const seats = await Event.getEventSeats(req.params.id);

      // Calculate final price for each seat
      const event = await Event.findById(req.params.id);
      const basePrice = parseFloat(event.price) || 0;
      const processedSeats = seats.map((seat) => ({
        seat_id: Number(seat.seat_id),
        event_id: Number(seat.event_id),
        seat_number: String(seat.seat_number || ""),
        seat_type: String(seat.seat_type || "regular"),
        price_multiplier: Number(seat.price_multiplier || 1),
        is_booked: Boolean(seat.is_booked || false),
        final_price: Number(
          (basePrice * (parseFloat(seat.price_multiplier) || 1)).toFixed(2)
        ),
        created_at: seat.created_at
          ? new Date(seat.created_at).toISOString()
          : null,
        updated_at: seat.updated_at
          ? new Date(seat.updated_at).toISOString()
          : null,
      }));

      res.status(200).json({
        status: "success",
        data: processedSeats,
      });
    } catch (err) {
      next(err);
    }
  }

  static async addEventImage(req, res, next) {
    try {
      // Check if event exists
      const event = await Event.findById(req.params.id);
      if (!event) {
        return next(new AppError("No event found with that ID", 404));
      }

      // Check if user is the organizer or admin
      if (
        event.organizer_id !== req.user.user_id &&
        req.user.role !== "admin"
      ) {
        return next(
          new AppError(
            "You are not authorized to add images to this event",
            403
          )
        );
      }

      if (!req.file) {
        return next(new AppError("Please upload an image", 400));
      }

      // In a real app, you would upload the image to cloud storage (S3, Cloudinary, etc.)
      // and get back a URL. Here we'll just simulate it.
      const imageUrl = `/uploads/events/${req.params.id}/${req.file.filename}`;

      const imageId = await Event.addEventImage(
        req.params.id,
        imageUrl,
        req.body.is_primary === "true"
      );

      res.status(201).json({
        status: "success",
        data: {
          imageId,
          imageUrl,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async addSeats(req, res, next) {
    try {
      // Check if event exists
      const event = await Event.findById(req.params.id);
      if (!event) {
        return next(new AppError("No event found with that ID", 404));
      }

      // Check if user is the organizer or admin
      if (
        event.organizer_id !== req.user.user_id &&
        req.user.role !== "admin"
      ) {
        return next(
          new AppError("You are not authorized to add seats to this event", 403)
        );
      }

      // Validate seats data
      const { seats } = req.body;
      if (!Array.isArray(seats)) {
        return next(new AppError("Seats must be an array", 400));
      }

      // Validate each seat
      for (const seat of seats) {
        if (!seat.seat_number || !seat.seat_type || !seat.price_multiplier) {
          return next(
            new AppError(
              "Each seat must have seat_number, seat_type, and price_multiplier",
              400
            )
          );
        }
        if (!["regular", "vip", "premium"].includes(seat.seat_type)) {
          return next(
            new AppError(
              "Invalid seat type. Must be regular, vip, or premium",
              400
            )
          );
        }
        if (
          typeof seat.price_multiplier !== "number" ||
          seat.price_multiplier < 1
        ) {
          return next(
            new AppError(
              "Price multiplier must be a number greater than or equal to 1",
              400
            )
          );
        }
      }

      // Add seats to the event
      await Event.addSeats(req.params.id, seats);

      res.status(201).json({
        status: "success",
        message: "Seats added successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = EventController;
