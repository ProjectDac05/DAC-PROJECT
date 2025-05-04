// Import database connection and bcrypt for password hashing
const db = require("../config/db");
const bcrypt = require("bcryptjs");

/**
 * Create a new user in the database
 * @param {string} name - User's full name
 * @param {string} email - User's email address
 * @param {string} password - User's raw password (will be hashed)
 * @returns {number} - ID of the newly created user
 */
const createUser = async (name, email, password) => {
  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user into database
  const [result] = await db.query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashedPassword]
  );

  return result.insertId; // Return new user's ID
};

/**
 * Find a user by their email
 * @param {string} email - Email to search for
 * @returns {object|null} - User object if found, otherwise null
 */
const findUserByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0] || null; // Return first match or null
};

// Export functions
module.exports = {
  createUser,
  findUserByEmail,
};
