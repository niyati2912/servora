require("dotenv").config();

const mongoose = require("mongoose");
const Service = require("../src/models/Service");

const maidService = {
  name: "Maid & Daily Household Help",
  slug: "maid-household-help",
  category: "Maid Service",
  providerType: "home_service",
  description:
    "Find help with sweeping, mopping, dishes, laundry, tidying, and everyday household chores.",
  pricingType: "hourly",
  basePrice: 299,
  estimatedDurationMinutes: 120,
  tags: [
    "maid",
    "house help",
    "daily household help",
    "sweeping",
    "mopping",
    "dishes",
    "laundry",
    "cleaning"
  ],
  isActive: true
};

async function main() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/sevora";

  await mongoose.connect(uri);

  await Service.updateOne(
    { slug: maidService.slug },
    { $set: maidService },
    { upsert: true, runValidators: true }
  );

  console.log("Maid service added or updated.");
}

main()
  .catch((error) => {
    console.error("Could not add maid service:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });