
const express = require("express");
const {
  createProfile,
  getProfiles,
  getMyProfile
} = require("../controllers/providerController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getProfiles);
router.post("/me", protect, createProfile);
router.get("/me", protect, getMyProfile);

module.exports = router;
