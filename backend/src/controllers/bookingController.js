
const Booking = require("../models/Booking");
const ServiceProvider = require("../models/ServiceProvider");

const createBooking = async (req, res) => {
  try {
    const {
      providerId,
      bookingType,
      scheduledAt,
      address,
      serviceDescription,
      trip,
      quotedPrice
    } = req.body;

    if (
      !providerId ||
      !["home_service", "driver"].includes(bookingType) ||
      !scheduledAt
    ) {
      return res.status(400).json({
        message: "Provider, booking type, and scheduled time are required"
      });
    }

    const scheduledDate = new Date(scheduledAt);

    if (
      Number.isNaN(scheduledDate.getTime()) ||
      scheduledDate <= new Date()
    ) {
      return res.status(400).json({
        message: "Scheduled time must be in the future"
      });
    }

    if (
      quotedPrice !== undefined &&
      (typeof quotedPrice !== "number" ||
        !Number.isFinite(quotedPrice) ||
        quotedPrice < 0)
    ) {
      return res.status(400).json({
        message: "Quoted price must be a non-negative number"
      });
    }

    const provider = await ServiceProvider.findById(providerId);

    if (!provider || provider.providerType !== bookingType) {
      return res.status(404).json({
        message: "Matching provider not found"
      });
    }

    if (provider.availability !== "available") {
      return res.status(400).json({
        message: "Provider is not currently available"
      });
    }

    if (bookingType === "home_service" && !address) {
      return res.status(400).json({
        message: "Service address is required"
      });
    }

    if (
      bookingType === "driver" &&
      (!trip?.pickup || !trip?.destination || !trip?.tripType)
    ) {
      return res.status(400).json({
        message: "Driver bookings require pickup, destination, and trip type"
      });
    }

    const booking = await Booking.create({
      customer: req.user._id,
      provider: provider._id,
      bookingType,
      scheduledAt: scheduledDate,
      address,
      serviceDescription,
      trip: bookingType === "driver" ? trip : undefined,
      quotedPrice,
      status: "pending"
    });

    return res.status(201).json({
      message: "Booking request created",
      booking
    });
  } catch (error) {
    console.error("Create booking error:", error.message);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const query = {};

    if (req.user.roles.includes("customer")) {
      query.customer = req.user._id;
    } else {
      const profile = await ServiceProvider.findOne({
        user: req.user._id
      });

      if (!profile) {
        return res.status(404).json({
          message: "Provider profile not found"
        });
      }

      query.provider = profile._id;
    }

    const bookings = await Booking.find(query)
      .populate("customer", "name email")
      .populate({
        path: "provider",
        populate: { path: "user", select: "name" }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error("Get bookings error:", error.message);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedTransitions = {
      pending: ["accepted", "rejected", "cancelled"],
      accepted: ["in_progress", "driver_arrived", "cancelled"],
      driver_arrived: ["trip_started", "cancelled"],
      trip_started: ["completed"],
      in_progress: ["completed"]
    };

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    const isCustomer =
      booking.customer.toString() === req.user._id.toString();

    const profile = await ServiceProvider.findOne({
      user: req.user._id
    });

    const isAssignedProvider =
      profile &&
      booking.provider.toString() === profile._id.toString();

    if (!isCustomer && !isAssignedProvider) {
      return res.status(403).json({
        message: "You cannot modify this booking"
      });
    }

    if (status === "cancelled" && isCustomer) {
      // Customers may cancel only before work or a trip begins.
      if (!["pending", "accepted"].includes(booking.status)) {
        return res.status(400).json({
          message: "This booking can no longer be cancelled by the customer"
        });
      }
    } else if (!isAssignedProvider) {
      return res.status(403).json({
        message: "Only the assigned provider can perform this action"
      });
    }

    const validNextStatuses = allowedTransitions[booking.status] || [];

    if (!validNextStatuses.includes(status)) {
      return res.status(400).json({
        message: `Cannot change booking from ${booking.status} to ${status}`
      });
    }

    if (
      booking.bookingType === "home_service" &&
      ["driver_arrived", "trip_started"].includes(status)
    ) {
      return res.status(400).json({
        message: "Driver statuses cannot be used for home-service bookings"
      });
    }

    if (
      booking.bookingType === "driver" &&
      ["in_progress"].includes(status)
    ) {
      return res.status(400).json({
        message: "Use driver_arrived or trip_started for driver bookings"
      });
    }

    booking.status = status;
    await booking.save();

    return res.status(200).json({
      message: "Booking status updated",
      booking
    });
  } catch (error) {
    console.error("Update booking error:", error.message);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  updateBookingStatus
};
