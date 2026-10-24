const express = require("express");
const {
  applyForJob,
  getMyApplications,
  getApplicationsForMyJobs,
  updateApplicationStatus,
  withdrawApplication
} = require("../controllers/applicationController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post(
  "/",
  authorizeRoles("customer", "provider", "driver"),
  applyForJob
);
router.get("/my", getMyApplications);
router.get("/received", authorizeRoles("employer"), getApplicationsForMyJobs);
router.patch("/:id/status", authorizeRoles("employer"), updateApplicationStatus);
// Ownership (applicant only) is checked inside the controller.
router.patch("/:id/withdraw", withdrawApplication);

module.exports = router;