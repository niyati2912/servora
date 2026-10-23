const mongoose = require("mongoose");
const Application = require("../models/Application");
const Job = require("../models/Job");

const applyForJob = async (req, res) => {
  try {
    const { jobId, resumeUrl, coverLetter } = req.body;

    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "A valid job ID is required" });
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

    const existing = await Application.findOne({
      job: job._id,
      applicant: req.user._id
    });

    if (existing) {
      return res.status(409).json({
        message: "You have already applied to this job",
        application: existing
      });
    }

    const application = await Application.create({
      job: job._id,
      applicant: req.user._id,
      resumeUrl: resumeUrl || undefined,
      coverLetter: coverLetter || "",
      status: "pending"
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      application
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You have already applied" });
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

    if (!["reviewing", "shortlisted", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid application status" });
    }

    const application = await Application.findById(req.params.id).populate("job");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only the employer who posted the job can update applications"
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

module.exports = {
  applyForJob,
  getMyApplications,
  getApplicationsForMyJobs,
  updateApplicationStatus
};