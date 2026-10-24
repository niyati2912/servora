const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from backend/.env");
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected", mongoose.connection.name);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    // Rethrow so server.js (which exits on failure) fails fast
    // instead of running an API that cannot reach its database.
    throw error;
  }
};

module.exports = connectDB;