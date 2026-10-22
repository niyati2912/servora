
const Report = require("../models/Report");

// Submit a report
const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body;

    const allowedTypes = [
      "user",
      "business",
      "provider",
      "job",
      "booking"
    ];

    if (!targetType || !allowedTypes.includes(targetType)) {
      return res.status(400).json({
        message: "targetType must be user, business, provider, job, or booking"
      });
    }

    if (!targetId || !/^[a-f\d]{24}$/i.test(targetId)) {
      return res.status(400).json({ message: "A valid targetId is required" });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason: reason.trim(),
      details
    });

    return res.status(201).json({
      message: "Report submitted successfully",
      report
    });
  } catch (error) {
    console.error("Create report error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// User views reports they submitted
const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error("Get my reports error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Admin views all reports, optionally filtered by status
const getAllReports = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      const allowedStatuses = ["open", "reviewing", "resolved", "dismissed"];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid report status" });
      }

      filter.status = req.query.status;
    }

    const reports = await Report.find(filter)
      .populate("reporter", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error("Get all reports error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Admin changes report status
const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["reviewing", "resolved", "dismissed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status must be reviewing, resolved, or dismissed"
      });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.status(200).json({
      message: "Report status updated",
      report
    });
  } catch (error) {
    console.error("Update report status error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createReport,
  getMyReports,
  getAllReports,
  updateReportStatus
};
