const mongoose = require("mongoose");
const Application = require("../models/Application");
const Job = require("../models/Job");
const { canTransitionApplicationStatus } = require("../utils/workflowRules");

const applyForJob = async (req, res) => {
  try {
    const { jobId, resumeUrl, coverLetter, city } = req.body;

    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "A valid job ID is required" });
    }

    if (city !== undefined && (typeof city !== "string" || city.trim().length > 100)) {
      return res.status(400).json({ message: "City must be 100 characters or fewer" });
    }

    const job = await Job.findById(jobId);

    if (!job || job.status !== "open") {
      return res.status(404).json({ message: "This job is no longer available" });
    }

    if (job.expiresAt && job.expiresAt <= new Date()) {
      return res.status(400).json({ message: "This job has expired" });
    }

    if (job.postedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot apply to your own job" });
    }

    // City the applicant is applying from: the one sent by the form,
    // otherwise the city saved on their account.
    const applicantCity = (city || req.user.city || "").trim();
    const letter = typeof coverLetter === "string" ? coverLetter.trim() : "";

    const existing = await Application.findOne({
      job: job._id,
      applicant: req.user._id
    });

    if (existing) {
      // One application per job is enforced by a unique index, so a
      // withdrawn application is re-opened instead of blocking forever.
      if (existing.status === "withdrawn") {
        existing.status = "submitted";
        existing.coverLetter = letter;
        existing.city = applicantCity || undefined;
        await existing.save();

        return res.status(200).json({
          message: "Application submitted again",
          application: existing
        });
      }

      return res.status(409).json({
        message: "You have already applied to this job",
        application: existing
      });
    }

    const application = await Application.create({
      job: job._id,
      applicant: req.user._id,
      resumeUrl: resumeUrl || undefined,
      coverLetter: letter,
      city: applicantCity || undefined,
      status: "submitted"
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      application
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You have already applied to this job" });
    }

    console.error("Apply for job error:", error);
    return res.status(500).json({ message: "Failed to submit application" });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate({
        path: "job",
        populate: [
          { path: "business", select: "name category locality address" },
          { path: "postedBy", select: "name phone" }
        ]
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error("Get my applications error:", error);
    return res.status(500).json({ message: "Failed to fetch applications" });
  }
};

const getApplicationsForMyJobs = async (req, res) => {
  try {
    const myJobs = await Job.find({ postedBy: req.user._id }).select("_id");
    const jobIds = myJobs.map((job) => job._id);

    const applications = await Application.find({ job: { $in: jobIds } })
      .populate("applicant", "name email phone city address")
      .populate("job", "title category locality employmentType status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error("Get applications for my jobs error:", error);
    return res.status(500).json({ message: "Failed to fetch applicants" });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["shortlisted", "selected", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be shortlisted, selected or rejected"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    const application = await Application.findById(req.params.id).populate("job");

    if (!application || !application.job) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only the employer who posted the job can update applications"
      });
    }

    if (!canTransitionApplicationStatus(application.status, status)) {
      return res.status(400).json({
        message: `Cannot change application from ${application.status} to ${status}`
      });
    }

    application.status = status;
    await application.save();

    return res.status(200).json({
      message: "Application status updated",
      application
    });
  } catch (error) {
    console.error("Update application status error:", error);
    return res.status(500).json({ message: "Failed to update application" });
  }
};

// PATCH /api/applications/:id/withdraw - applicants only
const withdrawApplication = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only withdraw your own application"
      });
    }

    if (!["submitted", "shortlisted"].includes(application.status)) {
      return res.status(400).json({
        message: `A ${application.status} application cannot be withdrawn`
      });
    }

    application.status = "withdrawn";
    await application.save();

    return res.status(200).json({
      message: "Application withdrawn",
      application
    });
  } catch (error) {
    console.error("Withdraw application error:", error);
    return res.status(500).json({ message: "Failed to withdraw application" });
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getApplicationsForMyJobs,
  updateApplicationStatus,
  withdrawApplication
};