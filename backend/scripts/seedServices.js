require("dotenv").config();

const mongoose = require("mongoose");
const Service = require("../src/models/Service");

const services = [
  {
    name: "Plumbing Repair",
    slug: "plumbing-repair",
    category: "Plumbing",
    providerType: "home_service",
    description: "Help with leaking taps, pipes and plumbing repairs.",
    pricingType: "starting_at",
    basePrice: 199,
    estimatedDurationMinutes: 60,
    tags: ["plumber", "leak", "tap", "pipes"]
  },
  {
    name: "Electrical Repair",
    slug: "electrical-repair",
    category: "Electrical",
    providerType: "home_service",
    description: "Help with switches, sockets, fans and electrical repairs.",
    pricingType: "starting_at",
    basePrice: 199,
    estimatedDurationMinutes: 60,
    tags: ["electrician", "switch", "socket", "fan"]
  },
  {
    name: "AC Service",
    slug: "ac-service",
    category: "Appliance Repair",
    providerType: "home_service",
    description: "Book AC inspection and routine servicing.",
    pricingType: "starting_at",
    basePrice: 499,
    estimatedDurationMinutes: 90,
    tags: ["ac", "air conditioner", "cooling"]
  },
  {
    name: "Washing Machine Repair",
    slug: "washing-machine-repair",
    category: "Appliance Repair",
    providerType: "home_service",
    description: "Arrange a washing machine technician visit.",
    pricingType: "starting_at",
    basePrice: 249,
    estimatedDurationMinutes: 60,
    tags: ["washing machine", "appliance"]
  },
  {
    name: "Refrigerator Repair",
    slug: "refrigerator-repair",
    category: "Appliance Repair",
    providerType: "home_service",
    description: "Arrange a refrigerator inspection.",
    pricingType: "starting_at",
    basePrice: 299,
    estimatedDurationMinutes: 60,
    tags: ["fridge", "refrigerator", "appliance"]
  },
  {
    name: "Bathroom Cleaning",
    slug: "bathroom-cleaning",
    category: "Cleaning",
    providerType: "home_service",
    description: "Book bathroom cleaning.",
    pricingType: "fixed",
    basePrice: 299,
    estimatedDurationMinutes: 60,
    tags: ["bathroom", "cleaning"]
  },
  {
    name: "Kitchen Cleaning",
    slug: "kitchen-cleaning",
    category: "Cleaning",
    providerType: "home_service",
    description: "Arrange kitchen cleaning.",
    pricingType: "starting_at",
    basePrice: 399,
    estimatedDurationMinutes: 90,
    tags: ["kitchen", "cleaning"]
  },
  {
    name: "Full Home Deep Cleaning",
    slug: "full-home-deep-cleaning",
    category: "Cleaning",
    providerType: "home_service",
    description: "Book a deeper clean for your home.",
    pricingType: "starting_at",
    basePrice: 1499,
    estimatedDurationMinutes: 180,
    tags: ["deep cleaning", "home cleaning"]
  },
  {
    name: "Hourly Household Help",
    slug: "hourly-household-help",
    category: "Household Help",
    providerType: "home_service",
    description: "Book short-duration household assistance.",
    pricingType: "hourly",
    basePrice: 299,
    estimatedDurationMinutes: 120,
    tags: ["house help", "chores", "hourly"]
  },
  {
    name: "Laundry and Ironing",
    slug: "laundry-and-ironing",
    category: "Household Help",
    providerType: "home_service",
    description: "Arrange laundry and ironing assistance.",
    pricingType: "starting_at",
    basePrice: 199,
    estimatedDurationMinutes: 60,
    tags: ["laundry", "ironing", "clothes"]
  },
  {
    name: "Furniture Assembly",
    slug: "furniture-assembly",
    category: "Installation",
    providerType: "home_service",
    description: "Book help assembling household furniture.",
    pricingType: "starting_at",
    basePrice: 399,
    estimatedDurationMinutes: 60,
    tags: ["furniture", "assembly", "installation"]
  },
  {
    name: "Driver for One-Way Trip",
    slug: "driver-one-way",
    category: "Driver",
    providerType: "driver",
    description: "Book a driver for a one-way trip in your own vehicle.",
    pricingType: "starting_at",
    basePrice: 399,
    estimatedDurationMinutes: 60,
    tripType: "one_way",
    tags: ["driver", "one way", "personal car"]
  },
  {
    name: "Driver for Round Trip",
    slug: "driver-round-trip",
    category: "Driver",
    providerType: "driver",
    description: "Book a driver for an outward and return journey.",
    pricingType: "starting_at",
    basePrice: 699,
    estimatedDurationMinutes: 120,
    tripType: "round_trip",
    tags: ["driver", "round trip", "personal car"]
  },
  {
    name: "Hourly Driver",
    slug: "hourly-driver",
    category: "Driver",
    providerType: "driver",
    description: "Book a driver for a specified number of hours.",
    pricingType: "hourly",
    basePrice: 199,
    estimatedDurationMinutes: 60,
    tripType: "hourly",
    tags: ["driver", "hourly", "personal car"]
  }
];

async function seedServices() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/sevora";

  await mongoose.connect(uri);

  await Service.bulkWrite(
    services.map((service) => ({
      updateOne: {
        filter: { slug: service.slug },
        update: { $set: { ...service, isActive: true } },
        upsert: true
      }
    }))
  );

  console.log(`Successfully seeded ${services.length} services.`);
}

seedServices()
  .catch((error) => {
    console.error("Service seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });