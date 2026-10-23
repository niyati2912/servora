
const express = require("express");

const {
  createOrUpdateProfile,
  getProfiles,
  getMyProfile,
  uploadMyDriverLicense
} = require("../controllers/providerController");

const { protect } = require("../middleware/authMiddleware");
const {
  uploadDriverLicense
} = require("../middleware/uploadDriverLicense");

const router = express.Router();

router.get("/", getProfiles);

router.post("/me", protect, createOrUpdateProfile);
router.get("/me", protect, getMyProfile);

router.post(
  "/me/driver-license",
  protect,
  (req, res, next) => {
    uploadDriverLicense.single("license")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          message: error.code === "LIMIT_FILE_SIZE"
            ? "The licence file must be 5 MB or smaller."
            : error.message || "Invalid licence upload."
        });
      }
      next();
    });
  },
  uploadMyDriverLicense
);

module.exports = router;
