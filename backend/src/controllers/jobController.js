
const Job = require("../models/Job");
const Business = require("../models/Business");

// Create a job listing
const createJob = async (req, res) => {
  try {
    const {
      businessId,
      title,
      description,
      category,
      locality,
      employmentType,
      salaryMin,
      salaryMax,
      expiresAt
    } = req.body;

    if (
      !businessId ||
      !title ||
      !description ||
      !category ||
      !locality ||
      !employmentType
    ) {
      return res.status(400).json({
        message:
          "businessId, title, description, category, locality, and employmentType are required"
      });
    }

    const allowedTypes = [
      "full_time",
      "part_time",
      "contract",
      "temporary"
    ];

    if (!allowedTypes.includes(employmentType)) {
      return res.status(400).json({
        message: `employmentType must be one of: ${allowedTypes.join(", ")}`
      });
    }

    const business = await Business.findById(businessId);

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const job = await Job.create({
      business: business._id,
      postedBy: req.user._id,
      title,
      description,
      category,
      locality,
      employmentType,
      salaryMin,
      salaryMax,
      expiresAt
    });

    return res.status(201).json({
      message: "Job posted successfully",
      job
    });
  } catch (error) {
    console.error("Create job error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Browse open jobs
const getJobs = async (req, res) => {
  try {
    const filter = { status: "open" };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.locality) {
      filter.locality = new RegExp(req.query.locality, "i");
    }

    const jobs = await Job.find(filter)
      .populate("business")
      .populate("postedBy", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({ count: jobs.length, jobs });
  } catch (error) {
    console.error("Get jobs error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get jobs posted by the logged-in employer
const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id })
      .populate("business")
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: jobs.length, jobs });
  } catch (error) {
    console.error("Get my jobs error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createJob, getJobs, getMyJobs };
