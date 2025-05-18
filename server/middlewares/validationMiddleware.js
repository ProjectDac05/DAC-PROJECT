const { body, param, validationResult } = require("express-validator");
const AppError = require("../utils/appError");

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }
  next();
};

// Booking validation rules
const bookingValidationRules = [
  body("event_id")
    .isInt({ min: 1 })
    .withMessage("Event ID must be a positive integer"),
  body("seat_ids")
    .isArray({ min: 1 })
    .withMessage("At least one seat must be selected"),
  body("seat_ids.*").isInt({ min: 1 }).withMessage("Invalid seat ID"),
  body("total_amount")
    .isFloat({ min: 0 })
    .withMessage("Total amount must be a positive number"),
];

// Event validation rules
const eventValidationRules = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters long"),
  body("date").isISO8601().withMessage("Invalid date format"),
  body("time")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Invalid time format (HH:mm)"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("capacity")
    .isInt({ min: 1 })
    .withMessage("Capacity must be a positive integer"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
];

// User validation rules
const userValidationRules = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Invalid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/)
    .withMessage(
      "Password must contain at least one number, one lowercase and one uppercase letter"
    ),
  body("phone")
    .optional()
    .matches(/^\+?[\d\s-]+$/)
    .withMessage("Invalid phone number format"),
];

// ID parameter validation
const idParamValidation = [
  param("id").isInt({ min: 1 }).withMessage("Invalid ID parameter"),
];

module.exports = {
  validate,
  bookingValidationRules,
  eventValidationRules,
  userValidationRules,
  idParamValidation,
};
