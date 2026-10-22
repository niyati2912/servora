const express = require("express");

const {
  browseServiceRequests,
  createServiceRequest,
  getMyServiceRequests,
  acceptServiceRequest,
  updateServiceRequestStatus
} = require("../controllers/serviceRequestController");

const {
  protect,
  authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", browseServiceRequests);
router.get("/my", protect, getMyServiceRequests);

router.post(
  "/",
  protect,
  authorizeRoles("customer", "employer"),
  createServiceRequest
);

router.post(
  "/:id/accept",
  protect,
  authorizeRoles("provider", "driver"),
  acceptServiceRequest
);

router.patch(
  "/:id/status",
  protect,
  updateServiceRequestStatus
);

module.exports = router;