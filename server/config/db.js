const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Check connection immediately
async function testDBConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connection successful!");
    connection.release(); // Release back to the pool
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1); // Exit process if you want to stop app on DB failure
  }
}

testDBConnection();

module.exports = pool;
