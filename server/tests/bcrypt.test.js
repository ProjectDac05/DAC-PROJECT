const bcrypt = require("bcrypt");

// Test password
const password = "password123";
const saltRounds = 10;

// Test bcrypt functionality
async function testBcrypt() {
  try {
    console.log("Starting bcrypt test...\n");

    // Test password hashing
    console.log("Testing password hashing...");
    const hash = await bcrypt.hash(password, saltRounds);
    console.log("Password:", password);
    console.log("Generated Hash:", hash);
    console.log("Hash starts with $2b$:", hash.startsWith("$2b$"));
    console.log("Hash length:", hash.length);
    console.log("\n");

    // Test password comparison (should be true)
    console.log("Testing correct password comparison...");
    const isMatch1 = await bcrypt.compare(password, hash);
    console.log('Comparing password "password123" with hash');
    console.log("Match result:", isMatch1);
    console.log("\n");

    // Test wrong password comparison (should be false)
    console.log("Testing incorrect password comparison...");
    const isMatch2 = await bcrypt.compare("wrongpassword", hash);
    console.log('Comparing password "wrongpassword" with hash');
    console.log("Match result:", isMatch2);
  } catch (error) {
    console.error("Error during bcrypt test:", error);
  }
}

// Run the test
testBcrypt();
