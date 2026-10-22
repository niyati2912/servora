require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Business = require("./models/Business");
const ServiceProvider = require("./models/ServiceProvider");
const Booking = require("./models/Booking");
const Job = require("./models/Job");
const Application = require("./models/Application");
const Review = require("./models/Review");
const ServiceRequest = require("./models/ServiceRequest");

const password = process.env.DEMO_SEED_PASSWORD || "SevoraDemo!2026";

const daysFromNow = days =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);

async function getUser(name, email, role) {
  let user = await User.findOne({ email });

  if (user) {
    // Only add the expected role for our reserved demo account.
    if (!user.roles.includes(role)) {
      user.roles.push(role);
      await user.save();
    }
    return user;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  return User.create({
    name,
    email,
    password: hashedPassword,
    roles: [role],
    isActive: true
  });
}

async function findOrCreate(Model, filter, fields) {
  let record = await Model.findOne(filter);
  if (record) return record;

  try {
    return await Model.create({ ...filter, ...fields });
  } catch (error) {
    if (error.code === 11000) {
      record = await Model.findOne(filter);
      if (record) return record;
    }
    throw error;
  }
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from backend/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const customer = await getUser(
    "Demo Customer",
    "customer@sevora.demo",
    "customer"
  );

  const employer = await getUser(
    "Demo Employer",
    "employer@sevora.demo",
    "employer"
  );

  const electricianUser = await getUser(
    "Aman Electrician",
    "electrician@sevora.demo",
    "provider"
  );

  const plumberUser = await getUser(
    "Gurpreet Plumber",
    "plumber@sevora.demo",
    "provider"
  );

  const driverUser = await getUser(
    "Ravi Driver",
    "driver@sevora.demo",
    "driver"
  );

  const worker = await getUser(
    "Demo Job Seeker",
    "worker@sevora.demo",
    "customer"
  );

  const electrician = await findOrCreate(
    ServiceProvider,
    { user: electricianUser._id },
    {
      providerType: "home_service",
      skills: ["Wiring", "Fans", "Switch repair"],
      serviceCategories: ["Electrician", "Electrical Repair"],
      serviceAreas: ["Rajpura", "Banur"],
      basePrice: 350,
      availability: "available",
      verificationStatus: "pending"
    }
  );

  const plumber = await findOrCreate(
    ServiceProvider,
    { user: plumberUser._id },
    {
      providerType: "home_service",
      skills: ["Leak repair", "Tap fitting", "Drain cleaning"],
      serviceCategories: ["Plumbing", "Plumber"],
      serviceAreas: ["Rajpura", "Patiala"],
      basePrice: 400,
      availability: "available",
      verificationStatus: "pending"
    }
  );

  const driver = await findOrCreate(
    ServiceProvider,
    { user: driverUser._id },
    {
      providerType: "driver",
      skills: ["City driving", "Highway driving"],
      serviceCategories: ["Driver"],
      serviceAreas: ["Rajpura", "Patiala", "Ambala"],
      basePrice: 500,
      availability: "available",
      verificationStatus: "pending"
    }
  );

  const business = await findOrCreate(
    Business,
    { owner: employer._id, name: "Sevora Demo Works" },
    {
      description: "Fictional local retail and services business.",
      category: "Local Services",
      address: "Main Market, Rajpura",
      locality: "Rajpura",
      verificationStatus: "unverified",
      isActive: true
    }
  );

  const jobSpecs = [
    {
      title: "Evening Store Assistant",
      category: "Retail",
      employmentType: "part_time",
      salaryMin: 7000,
      salaryMax: 10000,
      description:
        "Assist customers, arrange shelves and maintain basic stock records."
    },
    {
      title: "Junior Electrician Helper",
      category: "Electrician",
      employmentType: "full_time",
      salaryMin: 12000,
      salaryMax: 18000,
      description:
        "Assist an experienced electrician with tools and maintenance work."
    },
    {
      title: "Weekend Delivery Associate",
      category: "Delivery",
      employmentType: "part_time",
      salaryMin: 6000,
      salaryMax: 9000,
      description:
        "Deliver local orders and communicate with customers."
    },
    {
      title: "AC Technician Helper",
      category: "Technician",
      employmentType: "contract",
      salaryMin: 10000,
      salaryMax: 16000,
      description:
        "Help with AC servicing, cleaning and installation preparation."
    }
  ];

  const jobs = [];

  for (const spec of jobSpecs) {
    const job = await findOrCreate(
      Job,
      {
        business: business._id,
        postedBy: employer._id,
        title: spec.title
      },
      {
        ...spec,
        locality: "Rajpura",
        expiresAt: daysFromNow(45),
        status: "open"
      }
    );

    jobs.push(job);
  }

  await findOrCreate(
    Application,
    { job: jobs[0]._id, applicant: worker._id },
    {
      coverLetter:
        "I am reliable, available for evening shifts and familiar with Rajpura.",
      status: "submitted"
    }
  );

  const completedBooking = await findOrCreate(
    Booking,
    {
      customer: customer._id,
      provider: electrician._id,
      serviceDescription: "Replaced a faulty kitchen switch"
    },
    {
      bookingType: "home_service",
      scheduledAt: daysFromNow(-5),
      address: "Near Main Market, Rajpura",
      quotedPrice: 350,
      status: "completed"
    }
  );

  await findOrCreate(
    Review,
    { booking: completedBooking._id },
    {
      reviewer: customer._id,
      provider: electrician._id,
      rating: 5,
      comment: "Arrived on time and explained the repair clearly."
    }
  );

  await findOrCreate(
    Booking,
    {
      customer: customer._id,
      provider: plumber._id,
      serviceDescription: "Inspect a slow kitchen drain"
    },
    {
      bookingType: "home_service",
      scheduledAt: daysFromNow(3),
      address: "Model Town, Rajpura",
      quotedPrice: 400,
      status: "pending"
    }
  );

  const requestSpecs = [
    {
      title: "Ceiling fan is making a noise",
      requestType: "home_service",
      category: "Electrician",
      description:
        "Inspect a ceiling fan that has started making a rattling noise.",
      address: "Model Town, Rajpura",
      estimatedPrice: 500,
      scheduledAt: daysFromNow(4)
    },
    {
      title: "Repair a leaking kitchen tap",
      requestType: "home_service",
      category: "Plumbing",
      description:
        "The kitchen tap is leaking around its base.",
      address: "Green Avenue, Rajpura",
      estimatedPrice: 450,
      scheduledAt: daysFromNow(2)
    },
    {
      title: "Driver needed for a return trip",
      requestType: "driver",
      category: "Driver",
      description:
        "Experienced driver needed for a same-day return trip in the customer's car.",
      trip: {
        pickup: "Main Market, Rajpura",
        destination: "Patiala Bus Stand",
        tripType: "round_trip",
        vehicleTransmission: "manual"
      },
      estimatedPrice: 1200,
      scheduledAt: daysFromNow(6)
    }
  ];

  for (const spec of requestSpecs) {
    await findOrCreate(
      ServiceRequest,
      {
        customer: customer._id,
        title: spec.title,
        locality: "Rajpura"
      },
      {
        ...spec,
        locality: "Rajpura",
        status: "open"
      }
    );
  }

  const rating = await Review.aggregate([
    { $match: { provider: electrician._id } },
    {
      $group: {
        _id: "$provider",
        averageRating: { $avg: "$rating" }
      }
    }
  ]);

  const completedCount = await Booking.countDocuments({
    provider: electrician._id,
    status: "completed"
  });

  await ServiceProvider.updateOne(
    { _id: electrician._id },
    {
      $set: {
        averageRating: rating.length
          ? Number(rating[0].averageRating.toFixed(2))
          : 0,
        completedJobs: completedCount
      }
    }
  );

  console.log("Sevora demo data is ready.");
  console.log("No collections were cleared.");
  console.log("New demo accounts use DEMO_SEED_PASSWORD or the default password.");
  console.log("customer@sevora.demo");
  console.log("employer@sevora.demo");
  console.log("electrician@sevora.demo");
  console.log("plumber@sevora.demo");
  console.log("driver@sevora.demo");
  console.log("worker@sevora.demo");
}

main()
  .catch(error => {
    console.error("Demo seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });