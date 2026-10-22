
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");

async function testDB() {
  try {
    await connectDB();

    const testUser = await User.create({
      name: "Sevora Test",
      email: "sevora.test@example.com",
      password: "temporary-test-placeholder",
      role: "customer"
    });

    console.log("User saved successfully!");
    console.log(testUser);

  } catch (error) {
    console.error("Test failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testDB();
