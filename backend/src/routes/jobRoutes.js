
const express = require("express");
const {
  createJob,
  getJobs,
  getMyJobs
} = require("../controllers/jobController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getJobs);
router.get("/my", protect, authorizeRoles("employer"), getMyJobs);
router.post("/", protect, authorizeRoles("employer"), createJob);

module.exports = router;
