require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../src/models/User");
const Business = require("../src/models/Business");
const Job = require("../src/models/Job");
const ServiceProvider = require("../src/models/ServiceProvider");
const Service = require("../src/models/Service");

const cities = [
  { name: "Rajpura", state: "Punjab" },
  { name: "Ambala", state: "Haryana" },
  { name: "Panchkula", state: "Haryana" },
  { name: "Chandigarh", state: "Chandigarh" },
  { name: "Patiala", state: "Punjab" },
  { name: "Samana", state: "Punjab" },
  { name: "Sirhind", state: "Punjab" },
  { name: "Khanna", state: "Punjab" },
  { name: "Ludhiana", state: "Punjab" },
  { name: "Shahabad Markanda", state: "Haryana" },
  { name: "Kurukshetra", state: "Haryana" },
  { name: "Yamunanagar", state: "Haryana" },
  { name: "Zirakpur", state: "Punjab" },
  { name: "Mohali", state: "Punjab" },
  { name: "Amritsar", state: "Punjab" },
  { name: "Jalandhar", state: "Punjab" },
  { name: "Bathinda", state: "Punjab" },
  { name: "Karnal", state: "Haryana" }
];

const serviceDefinitions = [
  {
    name: "Plumbing Repair",
    slug: "plumbing-repair",
    category: "Plumbing",
    providerType: "home_service",
    description: "Book a professional for leaks, taps, pipes and common plumbing issues.",
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
    description: "Get help with switches, sockets, fans and basic electrical repairs.",
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
    description: "Schedule an AC inspection or routine servicing.",
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
    description: "Book a technician for washing machine problems.",
    pricingType: "starting_at",
    basePrice: 249,
    estimatedDurationMinutes: 60,
    tags: ["washing machine", "appliance repair"]
  },
  {
    name: "Refrigerator Repair",
    slug: "refrigerator-repair",
    category: "Appliance Repair",
    providerType: "home_service",
    description: "Get help diagnosing refrigerator cooling and appliance issues.",
    pricingType: "starting_at",
    basePrice: 299,
    estimatedDurationMinutes: 60,
    tags: ["fridge", "refrigerator", "appliance repair"]
  },
  {
    name: "Bathroom Cleaning",
    slug: "bathroom-cleaning",
    category: "Cleaning",
    providerType: "home_service",
    description: "Book a professional for bathroom cleaning.",
    pricingType: "fixed",
    basePrice: 299,
    estimatedDurationMinutes: 60,
    tags: ["bathroom", "cleaning", "housekeeping"]
  },
  {
    name: "Kitchen Cleaning",
    slug: "kitchen-cleaning",
    category: "Cleaning",
    providerType: "home_service",
    description: "Arrange cleaning for kitchen surfaces and common areas.",
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
    description: "Schedule a deeper clean for your home.",
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
    description: "Book short-duration help for everyday household chores.",
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
    description: "Arrange assistance with laundry and ironing.",
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
    description: "Get help assembling household furniture.",
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
    description: "Arrange a driver for an outward and return journey.",
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

const jobDefinitions = [
  {
    title: "Part-Time Store Assistant",
    description: "Help customers, organize stock and support daily shop operations.",
    category: "Retail",
    employmentType: "part_time",
    salaryMin: 8000,
    salaryMax: 12000
  },
  {
    title: "Electrician Helper",
    description: "Assist an experienced electrician with local service calls.",
    category: "Electrical",
    employmentType: "full_time",
    salaryMin: 12000,
    salaryMax: 18000
  },
  {
    title: "Delivery Associate",
    description: "Handle local deliveries and communicate with customers.",
    category: "Delivery",
    employmentType: "part_time",
    salaryMin: 9000,
    salaryMax: 15000
  }
];

async function upsertUser({ email, name, role, city, password, phone }) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return User.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        email,
        phone,
        city,
        isActive: true
      },
      $setOnInsert: {
        password: hashedPassword,
        roles: [role]
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function run() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/sevora";

  await mongoose.connect(uri);

  const demoPassword = process.env.DEMO_SEED_PASSWORD || "SevoraDemo2026!";

  for (const definition of serviceDefinitions) {
    await Service.findOneAndUpdate(
      { slug: definition.slug },
      { $set: { ...definition, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  let providerCount = 0;
  let jobCount = 0;

  for (const city of cities) {
    const businessOwner = await upsertUser({
      email: `employer.${city.name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@demo.sevora.local`,
      name: `Sevora ${city.name} Employer`,
      role: "employer",
      city: city.name,
      phone: "9876500000",
      password: demoPassword
    });

    const business = await Business.findOneAndUpdate(
      { owner: businessOwner._id, name: `Sevora ${city.name} Services` },
      {
        $set: {
          owner: businessOwner._id,
          name: `Sevora ${city.name} Services`,
          description: `Local service and employment opportunities in ${city.name}.`,
          category: "Local Services",
          address: `${city.name}, ${city.state}`,
          locality: city.name,
          verificationStatus: "verified"
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const homeProviderUser = await upsertUser({
      email: `home.provider.${city.name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@demo.sevora.local`,
      name: `${city.name} Home Services Professional`,
      role: "provider",
      city: city.name,
      phone: "9876500001",
      password: demoPassword
    });

    await ServiceProvider.findOneAndUpdate(
      { user: homeProviderUser._id },
      {
        $set: {
          user: homeProviderUser._id,
          providerType: "home_service",
          skills: [
            "Plumbing Repair",
            "Electrical Repair",
            "AC Service",
            "Washing Machine Repair",
            "Refrigerator Repair",
            "Bathroom Cleaning",
            "Kitchen Cleaning",
            "Full Home Deep Cleaning",
            "Hourly Household Help",
            "Laundry and Ironing",
            "Furniture Assembly"
          ],
          serviceCategories: [
            "Plumbing",
            "Electrical",
            "Appliance Repair",
            "Cleaning",
            "Household Help",
            "Installation"
          ],
          serviceAreas: [city.name],
          basePrice: 199,
          availability: "available",
          verificationStatus: "verified",
          averageRating: 4.7,
          completedJobs: 25
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const driverUser = await upsertUser({
      email: `driver.${city.name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@demo.sevora.local`,
      name: `${city.name} Driver`,
      role: "driver",
      city: city.name,
      phone: "9876500002",
      password: demoPassword
    });

    await ServiceProvider.findOneAndUpdate(
      { user: driverUser._id },
      {
        $set: {
          user: driverUser._id,
          providerType: "driver",
          skills: ["Driver for One-Way Trip", "Driver for Round Trip", "Hourly Driver"],
          serviceCategories: ["Driver"],
          serviceAreas: [city.name],
          basePrice: 399,
          availability: "available",
          verificationStatus: "verified",
          averageRating: 4.8,
          completedJobs: 32
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    providerCount += 2;

    for (let i = 0; i < jobDefinitions.length; i++) {
      const definition = jobDefinitions[i];

      await Job.findOneAndUpdate(
        {
          business: business._id,
          title: definition.title
        },
        {
          $set: {
            ...definition,
            business: business._id,
            postedBy: businessOwner._id,
            locality: city.name,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: "open"
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      jobCount++;
    }
  }

  console.log(`Seeded/updated ${serviceDefinitions.length} services.`);
  console.log(`Seeded/updated provider profiles across ${cities.length} cities.`);
  console.log(`Seeded/updated ${jobCount} city-specific jobs.`);
  console.log("Demo accounts use the DEMO_SEED_PASSWORD value or the development fallback.");
}

run()
  .catch((error) => {
    console.error("Marketplace seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });