const Job = require("../models/Job");
const Business = require("../models/Business");

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const employmentTypes = [
  "full_time",
  "part_time",
  "contract",
  "temporary"
];

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
      salaryMax
    } = req.body;

    if (
      !businessId ||
      !title?.trim() ||
      !description?.trim() ||
      !category?.trim() ||
      !locality?.trim() ||
      !employmentTypes.includes(employmentType)
    ) {
      return res.status(400).json({
        message:
          "Business, title, description, category, locality and employment type are required"
      });
    }

    const business = await Business.findById(businessId);

    if (!business) {
      return res.status(404).json({
        message: "Business not found"
      });
    }

    if (
      business.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "You can only post jobs for your own business"
      });
    }

    const min =
      salaryMin === undefined || salaryMin === ""
        ? undefined
        : Number(salaryMin);

    const max =
      salaryMax === undefined || salaryMax === ""
        ? undefined
        : Number(salaryMax);

    if (
      min !== undefined &&
      (!Number.isFinite(min) || min < 0)
    ) {
      return res.status(400).json({
        message: "Minimum salary must be a non-negative number"
      });
    }

    if (
      max !== undefined &&
      (!Number.isFinite(max) || max < 0)
    ) {
      return res.status(400).json({
        message: "Maximum salary must be a non-negative number"
      });
    }

    if (
      min !== undefined &&
      max !== undefined &&
      max < min
    ) {
      return res.status(400).json({
        message: "Maximum salary cannot be less than minimum salary"
      });
    }

    const job = await Job.create({
      business: business._id,
      postedBy: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      locality: locality.trim(),
      employmentType,
      ...(min !== undefined && { salaryMin: min }),
      ...(max !== undefined && { salaryMax: max }),
      status: "open"
    });

    return res.status(201).json({
      message: "Job posted successfully",
      job
    });
  } catch (error) {
    console.error("Create job error:", error.message);

    return res.status(500).json({
      message: "Unable to create job"
    });
  }
};

const getJobs = async (req, res) => {
  try {
    const filter = {
      status: "open"
    };

    if (req.query.category) {
      filter.category = new RegExp(
        escapeRegex(String(req.query.category).trim()),
        "i"
      );
    }

    if (req.query.locality) {
      filter.locality = new RegExp(
        escapeRegex(String(req.query.locality).trim()),
        "i"
      );
    }

    if (
      employmentTypes.includes(req.query.employmentType)
    ) {
      filter.employmentType = req.query.employmentType;
    }

    if (req.query.q) {
      const search = new RegExp(
        escapeRegex(String(req.query.q).trim()),
        "i"
      );

      filter.$or = [
        { title: search },
        { description: search },
        { category: search },
        { locality: search }
      ];
    }

    const requestedLimit = Number.parseInt(
      req.query.limit,
      10
    );

    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 100;

    const jobs = await Job.find(filter)
      .populate("business", "name category locality")
      .populate("postedBy", "name")
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error("Get jobs error:", error.message);

    return res.status(500).json({
      message: "Unable to load jobs"
    });
  }
};

const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      postedBy: req.user._id
    })
      .populate("business", "name category locality")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error("Get my jobs error:", error.message);

    return res.status(500).json({
      message: "Unable to load your jobs"
    });
  }
};

module.exports = {
  createJob,
  getJobs,
  getMyJobs
};