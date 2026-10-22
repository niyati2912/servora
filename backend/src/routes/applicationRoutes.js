
const express = require("express");
const {
  applyForJob,
  getMyApplications,
  getApplicationsForMyJobs,
  updateApplicationStatus
} = require("../controllers/applicationController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", authorizeRoles("customer"), applyForJob);
router.get("/my", getMyApplications);
router.get("/received", authorizeRoles("employer"), getApplicationsForMyJobs);
router.patch("/:id/status", authorizeRoles("employer"), updateApplicationStatus);

module.exports = router;
