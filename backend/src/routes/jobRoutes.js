const express = require("express");
const {
  createJob,
  getJobs,
  getMyJobs,
  closeJob
} = require("../controllers/jobController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getJobs);
router.get("/my", protect, authorizeRoles("employer"), getMyJobs);
router.post("/", protect, authorizeRoles("employer"), createJob);
router.patch("/:id/close", protect, authorizeRoles("employer"), closeJob);

module.exports = router;