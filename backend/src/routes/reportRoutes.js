
const express = require("express");
const {
  createReport,
  getMyReports,
  getAllReports,
  updateReportStatus
} = require("../controllers/reportController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createReport);
router.get("/my", getMyReports);

router.get("/", authorizeRoles("admin"), getAllReports);
router.patch("/:id/status", authorizeRoles("admin"), updateReportStatus);

module.exports = router;
