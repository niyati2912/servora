
const express = require("express");

const {
  createReview,
  getProviderReviews
} = require("../controllers/reviewController");

const {
  protect,
  authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/provider/:providerId", getProviderReviews);

router.post(
  "/",
  protect,
  authorizeRoles("customer"),
  createReview
);

module.exports = router;
