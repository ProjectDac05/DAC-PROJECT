const AppError = require("../utils/appError");

const validateEventData = (req, res, next) => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      total_seats,
      capacity,
      price,
      category_id,
      end_date,
      end_time,
      short_description,
      venue_details,
      image_url,
    } = req.body;

    // Required fields
    if (!title) throw new AppError("Event title is required", 400);
    if (!description) throw new AppError("Event description is required", 400);
    if (!date) throw new AppError("Event date is required", 400);
    if (!time) throw new AppError("Event time is required", 400);
    if (!location) throw new AppError("Event location is required", 400);
    if (!category_id) throw new AppError("Event category is required", 400);
    if (total_seats === undefined)
      throw new AppError("Total seats is required", 400);
    if (capacity === undefined) throw new AppError("Capacity is required", 400);
    if (price === undefined) throw new AppError("Event price is required", 400);

    // Data type validation
    if (typeof title !== "string")
      throw new AppError("Title must be a string", 400);
    if (typeof description !== "string")
      throw new AppError("Description must be a string", 400);
    if (typeof location !== "string")
      throw new AppError("Location must be a string", 400);
    if (typeof total_seats !== "number")
      throw new AppError("Total seats must be a number", 400);
    if (typeof capacity !== "number")
      throw new AppError("Capacity must be a number", 400);
    if (typeof price !== "number")
      throw new AppError("Price must be a number", 400);
    if (typeof category_id !== "number")
      throw new AppError("Category ID must be a number", 400);

    // Value validation
    if (total_seats <= 0)
      throw new AppError("Total seats must be greater than 0", 400);
    if (capacity <= 0)
      throw new AppError("Capacity must be greater than 0", 400);
    if (price < 0) throw new AppError("Price cannot be negative", 400);
    if (capacity < total_seats)
      throw new AppError("Capacity cannot be less than total seats", 400);

    // Optional fields validation
    if (end_date !== null && typeof end_date !== "string")
      throw new AppError("End date must be a string or null", 400);
    if (end_time !== null && typeof end_time !== "string")
      throw new AppError("End time must be a string or null", 400);
    if (short_description !== null && typeof short_description !== "string")
      throw new AppError("Short description must be a string or null", 400);
    if (venue_details !== null && typeof venue_details !== "string")
      throw new AppError("Venue details must be a string or null", 400);
    if (image_url !== null && typeof image_url !== "string")
      throw new AppError("Image URL must be a string or null", 400);

    // Date format validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!dateRegex.test(date))
      throw new AppError("Invalid date format. Use YYYY-MM-DD", 400);
    if (!timeRegex.test(time))
      throw new AppError("Invalid time format. Use HH:MM", 400);
    if (end_date && !dateRegex.test(end_date))
      throw new AppError("Invalid end date format. Use YYYY-MM-DD", 400);
    if (end_time && !timeRegex.test(end_time))
      throw new AppError("Invalid end time format. Use HH:MM", 400);

    // Convert empty strings to null for optional fields
    req.body.end_date = end_date || null;
    req.body.end_time = end_time || null;
    req.body.short_description = short_description || null;
    req.body.venue_details = venue_details || null;
    req.body.image_url = image_url || null;

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  validateEventData,
};
