const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { createUser, findUserByEmail } = require("../models/userModel");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Create new user
    const userId = await createUser(name, email, password);

    // Send success response
    res.status(201).json({ message: "User created successfully!", userId });
  } catch (error) {
    console.error(error.message);
    next(error); // Forward error to error-handling middleware
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Compare entered password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Create JWT token
    const payload = { id: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Send token back to client
    res.json({ token });
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};
