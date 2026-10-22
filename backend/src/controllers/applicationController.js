
const Application = require("../models/Application");
const Job = require("../models/Job");

// Applicant applies for an open job
const applyForJob = async (req, res) => {
  try {
    const { jobId, resumeUrl, coverLetter } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: "jobId is required" });
    }

    const job = await Job.findOne({ _id: jobId, status: "open" });

    if (!job) {
      return res.status(404).json({ message: "Open job not found" });
    }

    if (job.postedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot apply to your own job"
      });
    }

    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: req.user._id
    });

    if (existingApplication) {
      return res.status(409).json({
        message: "You have already applied for this job"
      });
    }

    const application = await Application.create({
      job: jobId,
      applicant: req.user._id,
      resumeUrl,
      coverLetter
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      application
    });
  } catch (error) {
    // MongoDB unique index also protects against duplicate applications
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already applied for this job"
      });
    }

    console.error("Apply for job error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Applicant views their applications
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      applicant: req.user._id
    })
      .populate("job")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error("Get my applications error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Employer views applications for jobs they posted
const getApplicationsForMyJobs = async (req, res) => {
  try {
    const myJobs = await Job.find({ postedBy: req.user._id }).select("_id");
    const jobIds = myJobs.map(job => job._id);

    const applications = await Application.find({ job: { $in: jobIds } })
      .populate("applicant", "name email")
      .populate("job", "title category locality")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error("Get job applications error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Employer updates an application's status
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["shortlisted", "selected", "rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status must be shortlisted, selected, or rejected"
      });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const job = await Job.findOne({
      _id: application.job,
      postedBy: req.user._id
    });

    if (!job) {
      return res.status(403).json({
        message: "You can only review applications for your own jobs"
      });
    }

    if (application.status === "withdrawn") {
      return res.status(400).json({
        message: "Withdrawn applications cannot be updated"
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
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getApplicationsForMyJobs,
  updateApplicationStatus
};
