const express = require("express");

const {
  createBooking,
  getMyBookings,
  updateBookingStatus
} = require("../controllers/bookingController");

const {
  protect,
  authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post(
  "/",
  authorizeRoles("customer", "employer", "provider", "driver"),
  createBooking
);

router.get("/my", getMyBookings);

router.patch("/:id/status", updateBookingStatus);

module.exports = router;  