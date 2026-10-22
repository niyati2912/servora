
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");

const User = require("./models/User");
const Business = require("./models/Business");
const ServiceProvider = require("./models/ServiceProvider");
const Booking = require("./models/Booking");
const Job = require("./models/Job");
const Application = require("./models/Application");
const Review = require("./models/Review");
const Report = require("./models/Report");

const models = [
  User,
  Business,
  ServiceProvider,
  Booking,
  Job,
  Application,
  Review,
  Report
];

async function setupDatabase() {
  try {
    await connectDB();

    for (const Model of models) {
      await Model.createCollection();
      await Model.createIndexes();
      console.log(`Ready: ${Model.collection.name}`);
    }

    console.log("Sevora database setup completed.");
  } catch (error) {
    console.error("Database setup failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

setupDatabase();
