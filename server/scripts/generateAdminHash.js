const bcrypt = require("bcryptjs");
const db = require("../config/db");

async function updateAdminPassword() {
  try {
    // Generate new hash
    const password = "password123";
    const hash = await bcrypt.hash(password, 12);
    console.log("Generated new hash:", hash);

    // Update admin password
    const [result] = await db.query(
      `UPDATE users 
             SET password = ?,
                 failed_login_attempts = 0,
                 lockout_time = NULL
             WHERE email = ?`,
      [hash, "admin@eventbook.com"]
    );

    console.log("Update result:", result);

    // Clear any existing refresh tokens
    await db.query(
      `DELETE FROM refresh_tokens 
             WHERE user_id = (SELECT user_id FROM users WHERE email = ?)`,
      ["admin@eventbook.com"]
    );

    console.log(
      "Successfully updated admin password and cleared refresh tokens"
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

updateAdminPassword();
