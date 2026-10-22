
const express = require("express");
const {
  createBusiness,
  getBusinesses,
  getMyBusinesses
} = require("../controllers/businessController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getBusinesses);
router.get("/my", protect, getMyBusinesses);
router.post("/", protect, authorizeRoles("employer"), createBusiness);

module.exports = router;
