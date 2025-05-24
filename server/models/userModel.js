const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } = process.env;

class User {
  static async findByEmail(email) {
    const [rows] = await db.query(
      "SELECT user_id, name, email, password, phone, role, is_active, failed_login_attempts, lockout_time FROM users WHERE email = ?",
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.query(
      "SELECT user_id, name, email, password, phone, role, is_active, failed_login_attempts, lockout_time FROM users WHERE user_id = ?",
      [id]
    );
    return rows[0];
  }

  static async create({ name, email, password, phone, role = "user" }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, phone, role]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    values.push(id);
    await db.query(
      `UPDATE users SET ${fields.join(", ")} WHERE user_id = ?`,
      values
    );
    return true;
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async generateAuthToken(user) {
    const token = jwt.sign({ id: user.user_id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN || "1h",
    });

    const refreshToken = jwt.sign({ id: user.user_id }, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN || "7d",
    });

    await db.query(
      "INSERT INTO refresh_tokens (user_id, refresh_token, expiry) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
      [user.user_id, refreshToken]
    );

    return { token, refreshToken };
  }

  static async verifyRefreshToken(refreshToken) {
    const [rows] = await db.query(
      "SELECT * FROM refresh_tokens WHERE refresh_token = ? AND expiry > NOW() AND is_blacklisted = FALSE",
      [refreshToken]
    );

    if (!rows.length) return null;

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      return decoded;
    } catch (err) {
      return null;
    }
  }

  static async invalidateRefreshToken(refreshToken) {
    await db.query(
      "UPDATE refresh_tokens SET is_blacklisted = TRUE WHERE refresh_token = ?",
      [refreshToken]
    );
  }

  static async incrementFailedLoginAttempts(email) {
    await db.query(
      "UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE email = ?",
      [email]
    );
  }

  static async lockAccount(email) {
    await db.query(
      "UPDATE users SET lockout_time = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE email = ?",
      [email]
    );
  }

  static async resetFailedLoginAttempts(email) {
    await db.query(
      "UPDATE users SET failed_login_attempts = 0, lockout_time = NULL WHERE email = ?",
      [email]
    );
  }

  static async updateRole(userId, role) {
    await db.query("UPDATE users SET role = ? WHERE user_id = ?", [
      role,
      userId,
    ]);
    return true;
  }
}

module.exports = User;
