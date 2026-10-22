
const mongoose = require("mongoose");
const Business = require("../models/Business");
const Job = require("../models/Job");

const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "temporary"
];

const hasText = value =>
  typeof value === "string" && value.trim().length > 0;

const escapeRegex = value =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function parseOptionalMoney(value, field) {
  if (value === undefined || value === null || value === "") {
    return { value: undefined };
  }

  if (typeof value !== "number" && typeof value !== "string") {
    return { error: `${field} must be a non-negative number` };
  }

  if (typeof value === "string" && !value.trim()) {
    return { value: undefined };
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return { error: `${field} must be a non-negative number` };
  }

  return { value: number };
}

function parseExpiry(value) {
  if (value === undefined || value === null || value === "") {
    return { value: undefined };
  }

  if (typeof value !== "string" && !(value instanceof Date)) {
    return { error: "expiresAt must be a valid date" };
  }

  const text = value instanceof Date ? value.toISOString() : value.trim();

  // A date-only deadline remains valid until the end of that local day.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T23:59:59.999`)
    : new Date(text);

  if (Number.isNaN(date.getTime())) {
    return { error: "expiresAt must be a valid date" };
  }

  if (date <= new Date()) {
    return { error: "expiresAt must be in the future" };
  }

  return { value: date };
}

// GET /api/jobs
// Public search for open, unexpired jobs.
const getJobs = async (req, res) => {
  try {
    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);

    const page =
      Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1;

    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 50)
        : 20;

    if (
      req.query.employmentType &&
      !EMPLOYMENT_TYPES.includes(req.query.employmentType)
    ) {
      return res.status(400).json({
        message: `employmentType must be one of: ${EMPLOYMENT_TYPES.join(", ")}`
      });
    }

    // Don't show jobs belonging to businesses that have been deactivated.
    const activeBusinesses = await Business.find({
      isActive: { $ne: false }
    }).distinct("_id");

    const filters = [
      { status: "open" },
      { business: { $in: activeBusinesses } },
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      }
    ];

    if (hasText(req.query.locality)) {
      filters.push({
        locality: new RegExp(
          escapeRegex(req.query.locality.trim()),
          "i"
        )
      });
    }

    if (hasText(req.query.category)) {
      filters.push({
        category: new RegExp(
          escapeRegex(req.query.category.trim()),
          "i"
        )
      });
    }

    if (req.query.employmentType) {
      filters.push({
        employmentType: req.query.employmentType
      });
    }

    const searchText = req.query.search || req.query.q;

    if (hasText(searchText)) {
      const searchRegex = new RegExp(
        escapeRegex(searchText.trim()),
        "i"
      );

      filters.push({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
          { locality: searchRegex }
        ]
      });
    }

    const filter = { $and: filters };

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate(
          "business",
          "name category locality verificationStatus"
        )
        .populate("postedBy", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Job.countDocuments(filter)
    ]);

    return res.status(200).json({
      count: jobs.length,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      jobs
    });
  } catch (error) {
    console.error("Get jobs error:", error.message);

    return res.status(500).json({
      message: "Unable to load jobs"
    });
  }
};

// GET /api/jobs/my
// An employer sees only the jobs they posted.
const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      postedBy: req.user._id
    })
      .populate(
        "business",
        "name category locality verificationStatus"
      )
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

// POST /api/jobs
// An employer may post only for their own active business.
const createJob = async (req, res) => {
  try {
    const {
      businessId: suppliedBusinessId,
      business: businessField,
      title,
      description,
      category,
      locality,
      employmentType,
      salaryMin,
      salaryMax,
      expiresAt
    } = req.body || {};

    // Accept businessId from the frontend while supporting
    // callers that send the model's existing "business" field.
    const businessId = suppliedBusinessId || businessField;

    if (!businessId || !mongoose.isValidObjectId(businessId)) {
      return res.status(400).json({
        message: "A valid businessId is required"
      });
    }

    const requiredFields = {
      title,
      description,
      category,
      locality
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!hasText(value)) {
        return res.status(400).json({
          message: `${field} is required`
        });
      }
    }

    if (title.trim().length > 120) {
      return res.status(400).json({
        message: "title cannot exceed 120 characters"
      });
    }

    if (description.trim().length > 5000) {
      return res.status(400).json({
        message: "description cannot exceed 5000 characters"
      });
    }

    if (category.trim().length > 80) {
      return res.status(400).json({
        message: "category cannot exceed 80 characters"
      });
    }

    if (locality.trim().length > 100) {
      return res.status(400).json({
        message: "locality cannot exceed 100 characters"
      });
    }

    if (!EMPLOYMENT_TYPES.includes(employmentType)) {
      return res.status(400).json({
        message: `employmentType must be one of: ${EMPLOYMENT_TYPES.join(", ")}`
      });
    }

    const minResult = parseOptionalMoney(salaryMin, "salaryMin");

    if (minResult.error) {
      return res.status(400).json({
        message: minResult.error
      });
    }

    const maxResult = parseOptionalMoney(salaryMax, "salaryMax");

    if (maxResult.error) {
      return res.status(400).json({
        message: maxResult.error
      });
    }

    if (
      minResult.value !== undefined &&
      maxResult.value !== undefined &&
      maxResult.value < minResult.value
    ) {
      return res.status(400).json({
        message: "salaryMax cannot be less than salaryMin"
      });
    }

    const expiryResult = parseExpiry(expiresAt);

    if (expiryResult.error) {
      return res.status(400).json({
        message: expiryResult.error
      });
    }

    const business = await Business.findOne({
      _id: businessId,
      isActive: { $ne: false }
    });

    if (!business) {
      return res.status(404).json({
        message: "Active business not found"
      });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only post jobs for your own business"
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
      salaryMin: minResult.value,
      salaryMax: maxResult.value,
      expiresAt: expiryResult.value,
      status: "open"
    });

    await job.populate(
      "business",
      "name category locality verificationStatus"
    );

    return res.status(201).json({
      message: "Job created successfully",
      job
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message
      });
    }

    console.error("Create job error:", error.message);

    return res.status(500).json({
      message: "Unable to create job"
    });
  }
};

module.exports = {
  createJob,
  getJobs,
  getMyJobs
};
