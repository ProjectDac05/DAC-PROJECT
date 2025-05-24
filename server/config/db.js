require("dotenv").config(); // Add this at the top
const mysql = require("mysql2/promise");

// Create a connection pool with proper error handling
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "", // Make sure this matches your .env
  database: process.env.DB_NAME || "event_booking_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+00:00",
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: true,
  dateStrings: true, // This will make MySQL return date/time as strings
});

// Test the connection
async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log("✅ Connected to MySQL database");

    // Verify database exists
    const [rows] = await connection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [process.env.DB_NAME || "event_booking_db"]
    );

    if (rows.length === 0) {
      console.error(
        `❌ Database "${process.env.DB_NAME}" not found. Run schema.sql first.`
      );
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Error connecting to MySQL:", err.message);
    console.log("Please verify:");
    console.log(`- MySQL server is running`);
    console.log(`- DB_USER has proper privileges`);
    console.log(`- .env file has correct credentials`);
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
}

testConnection();

module.exports = pool;
