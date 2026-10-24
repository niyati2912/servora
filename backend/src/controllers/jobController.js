const mongoose = require("mongoose");
const Job = require("../models/Job");
const Business = require("../models/Business");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createJob = async (req, res) => {
  try {
    const {
      business: businessId,
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
      !mongoose.Types.ObjectId.isValid(businessId) ||
      !title?.trim() ||
      !description?.trim() ||
      !category?.trim() ||
      !locality?.trim() ||
      !["full_time", "part_time", "contract", "temporary"].includes(employmentType)
    ) {
      return res.status(400).json({ message: "Missing or invalid job fields" });
    }

    const business = await Business.findById(businessId);

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only post jobs for a business you own"
      });
    }

    const minSalary = salaryMin === undefined ? undefined : Number(salaryMin);
    const maxSalary = salaryMax === undefined ? undefined : Number(salaryMax);

    if (
      (minSalary !== undefined && (!Number.isFinite(minSalary) || minSalary < 0)) ||
      (maxSalary !== undefined && (!Number.isFinite(maxSalary) || maxSalary < 0)) ||
      (minSalary !== undefined && maxSalary !== undefined && minSalary > maxSalary)
    ) {
      return res.status(400).json({ message: "Invalid salary range" });
    }

    const expiry = expiresAt ? new Date(expiresAt) : undefined;

    if (expiry && (Number.isNaN(expiry.getTime()) || expiry <= new Date())) {
      return res.status(400).json({ message: "Expiry must be in the future" });
    }

    const job = await Job.create({
      business: business._id,
      postedBy: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      locality: locality.trim(),
      employmentType,
      salaryMin: minSalary,
      salaryMax: maxSalary,
      expiresAt: expiry,
      status: "open"
    });

    return res.status(201).json({
      message: "Job posted successfully",
      job
    });
  } catch (error) {
    console.error("Create job error:", error);
    return res.status(500).json({ message: "Failed to create job" });
  }
};

const getJobs = async (req, res) => {
  try {
    const filter = { status: "open" };

    if (req.query.locality) {
      filter.locality = {
        $regex: escapeRegex(req.query.locality),
        $options: "i"
      };
    }

    if (req.query.category) {
      filter.category = {
        $regex: escapeRegex(req.query.category),
        $options: "i"
      };
    }

    if (req.query.employmentType) {
      const types = ["full_time", "part_time", "contract", "temporary"];

      if (!types.includes(req.query.employmentType)) {
        return res.status(400).json({ message: "Invalid employment type" });
      }

      filter.employmentType = req.query.employmentType;
    }

    // Expiry and search text each need their own $or, so both go inside
    // $and. (Assigning filter.$or twice made the expiry filter overwrite
    // the search text.)
    const clauses = [
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      }
    ];

    if (req.query.q) {
      const pattern = {
        $regex: escapeRegex(req.query.q),
        $options: "i"
      };

      clauses.push({
        $or: [
          { title: pattern },
          { description: pattern },
          { category: pattern }
        ]
      });
    }

    filter.$and = clauses;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const jobs = await Job.find(filter)
      .populate("business", "name category locality address")
      .populate("postedBy", "name phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments(filter);

    return res.status(200).json({
      count: jobs.length,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      jobs
    });
  } catch (error) {
    console.error("Get jobs error:", error);
    return res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id })
      .populate("business", "name category locality address")
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: jobs.length, jobs });
  } catch (error) {
    console.error("Get my jobs error:", error);
    return res.status(500).json({ message: "Failed to fetch your jobs" });
  }
};

// PATCH /api/jobs/:id/close - the employer who posted the job
const closeJob = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only close jobs that you posted"
      });
    }

    if (job.status !== "open") {
      return res.status(400).json({
        message: `This job is already ${job.status}`
      });
    }

    job.status = "closed";
    await job.save();

    return res.status(200).json({ message: "Job closed", job });
  } catch (error) {
    console.error("Close job error:", error);
    return res.status(500).json({ message: "Failed to close job" });
  }
};

module.exports = { createJob, getJobs, getMyJobs, closeJob };