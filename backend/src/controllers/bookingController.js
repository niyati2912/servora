const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const ServiceProvider = require("../models/ServiceProvider");

const ACTIVE_STATUSES = [
  "pending",
  "accepted",
  "in_progress",
  "driver_arrived",
  "trip_started"
];

const ALLOWED_TRANSITIONS = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["in_progress", "driver_arrived", "cancelled"],
  driver_arrived: ["trip_started", "cancelled"],
  trip_started: ["completed"],
  in_progress: ["completed"]
};

const VALID_BOOKING_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "in_progress",
  "driver_arrived",
  "trip_started",
  "completed",
  "cancelled"
];

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ");

// If a provider has listed skills/categories, check that they match.
// Empty legacy profiles remain usable until their skills are completed.
const providerCanPerform = (provider, service) => {
  const capabilities = [
    ...(provider.skills || []),
    ...(provider.serviceCategories || [])
  ]
    .map(normalize)
    .filter(Boolean);

  if (capabilities.length === 0) {
    return true;
  }

  const serviceTerms = [
    service.name,
    service.category,
    ...(service.tags || [])
  ]
    .map(normalize)
    .filter(Boolean);

  return capabilities.some((capability) =>
    serviceTerms.some(
      (term) =>
        capability === term ||
        capability.includes(term) ||
        term.includes(capability)
    )
  );
};

// POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const {
      providerId,
      serviceId,
      bookingType,
      scheduledAt,
      durationMinutes,
      address,
      serviceDescription,
      trip
    } = req.body;

    if (
      !providerId ||
      !mongoose.Types.ObjectId.isValid(providerId) ||
      !["home_service", "driver"].includes(bookingType) ||
      !scheduledAt
    ) {
      return res.status(400).json({
        message: "A valid provider, booking type and scheduled time are required"
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

    let service = null;

    // New catalogue-based booking. Older clients can still submit
    // serviceDescription without serviceId for backward compatibility.
    if (serviceId) {
      if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        return res.status(400).json({
          message: "Invalid service ID"
        });
      }

      service = await Service.findOne({
        _id: serviceId,
        isActive: true
      });

      if (!service) {
        return res.status(404).json({
          message: "Selected service was not found or is inactive"
        });
      }

      if (service.providerType !== bookingType) {
        return res.status(400).json({
          message: "Selected service does not match the booking type"
        });
      }

      if (!providerCanPerform(provider, service)) {
        return res.status(400).json({
          message: "This provider has not listed the selected service or skill"
        });
      }
    }

    let finalDuration = Number(
      durationMinutes ??
        service?.estimatedDurationMinutes ??
        60
    );

    if (
      !Number.isInteger(finalDuration) ||
      finalDuration < 15 ||
      finalDuration > 1440
    ) {
      return res.status(400).json({
        message: "Duration must be between 15 and 1440 whole minutes"
      });
    }

    if (bookingType === "home_service" && !String(address || "").trim()) {
      return res.status(400).json({
        message: "Service address is required"
      });
    }

    if (bookingType === "driver") {
      if (
        !String(trip?.pickup || "").trim() ||
        !String(trip?.destination || "").trim() ||
        !["one_way", "round_trip", "hourly"].includes(trip?.tripType)
      ) {
        return res.status(400).json({
          message:
            "Driver bookings require pickup, destination and a valid trip type"
        });
      }

      if (
        trip.vehicleTransmission &&
        !["manual", "automatic"].includes(trip.vehicleTransmission)
      ) {
        return res.status(400).json({
          message: "Vehicle transmission must be manual or automatic"
        });
      }

      if (service?.tripType && service.tripType !== trip.tripType) {
        return res.status(400).json({
          message: "Trip type does not match the selected driver service"
        });
      }
    }

    // Calculate the price using the service catalogue.
    // Never trust a quotedPrice supplied by the client.
    let calculatedPrice;

    if (service && service.pricingType !== "quote") {
      if (
        typeof service.basePrice === "number" &&
        Number.isFinite(service.basePrice)
      ) {
        calculatedPrice =
          service.pricingType === "hourly"
            ? service.basePrice * Math.ceil(finalDuration / 60)
            : service.basePrice;
      }
    }

    // Prevent overlapping bookings for this provider.
    // The 24-hour lookback covers the maximum allowed booking duration.
    const candidateEnd = new Date(
      scheduledDate.getTime() + finalDuration * 60 * 1000
    );

    const earliestPossibleStart = new Date(
      scheduledDate.getTime() - 24 * 60 * 60 * 1000
    );

    const nearbyBookings = await Booking.find({
      provider: provider._id,
      status: { $in: ACTIVE_STATUSES },
      scheduledAt: {
        $gte: earliestPossibleStart,
        $lt: candidateEnd
      }
    })
      .select("scheduledAt durationMinutes")
      .lean();

    const hasConflict = nearbyBookings.some((existing) => {
      const existingStart = new Date(existing.scheduledAt).getTime();
      const existingDuration = existing.durationMinutes || 60;
      const existingEnd =
        existingStart + existingDuration * 60 * 1000;

      return (
        scheduledDate.getTime() < existingEnd &&
        existingStart < candidateEnd.getTime()
      );
    });

    if (hasConflict) {
      return res.status(409).json({
        message: "Provider already has a booking during this time"
      });
    }

    const bookingData = {
      customer: req.user._id,
      provider: provider._id,
      bookingType,
      scheduledAt: scheduledDate,
      durationMinutes: finalDuration,
      address,
      serviceDescription: service
        ? service.name
        : serviceDescription,
      trip: bookingType === "driver" ? trip : undefined,
      status: "pending"
    };

    if (service) {
      bookingData.service = service._id;
    }

    // For catalogue-based bookings, use the server-calculated price.
    // For quote-based services, the price stays unset until quoted.
    if (calculatedPrice !== undefined) {
      bookingData.quotedPrice = calculatedPrice;
    }

    const booking = await Booking.create(bookingData);

    return res.status(201).json({
      message: "Booking request created",
      booking
    });
  } catch (error) {
    console.error("Create booking error:", error);

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        message: "Invalid booking data",
        error: error.message
      });
    }

    return res.status(500).json({
      message: "Failed to create booking"
    });
  }
};

// GET /api/bookings/my
const getMyBookings = async (req, res) => {
  try {
    const roles = req.user.roles || [];
    const conditions = [];

    // Employers are included for compatibility with your existing
    // create-booking permission.
    if (roles.includes("customer") || roles.includes("employer")) {
      conditions.push({ customer: req.user._id });
    }

    const profile = await ServiceProvider.findOne({
      user: req.user._id
    }).select("_id");

    if (profile) {
      conditions.push({ provider: profile._id });
    }

    if (conditions.length === 0) {
      return res.status(403).json({
        message: "No customer or service-provider booking profile found"
      });
    }

    const query =
      conditions.length === 1
        ? conditions[0]
        : { $or: conditions };

    const bookings = await Booking.find(query)
      .populate("customer", "name email")
      .populate({
        path: "provider",
        populate: {
          path: "user",
          select: "name"
        }
      })
      .populate("service", "name category pricingType basePrice")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error("Get bookings error:", error);

    return res.status(500).json({
      message: "Failed to fetch bookings"
    });
  }
};

// PATCH /api/bookings/:id/status
const updateBookingStatus = async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;

    if (!VALID_BOOKING_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid booking status"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid booking ID"
      });
    }

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
    }).select("_id");

    const isAssignedProvider =
      profile &&
      booking.provider.toString() === profile._id.toString();

    if (!isCustomer && !isAssignedProvider) {
      return res.status(403).json({
        message: "You cannot modify this booking"
      });
    }

    // Customers can only cancel before work starts.
    if (status === "cancelled" && isCustomer) {
      if (!["pending", "accepted"].includes(booking.status)) {
        return res.status(400).json({
          message:
            "Customers can cancel only pending or accepted bookings"
        });
      }
    } else if (!isAssignedProvider) {
      return res.status(403).json({
        message: "Only the assigned provider can perform this action"
      });
    }

    const validNextStatuses =
      ALLOWED_TRANSITIONS[booking.status] || [];

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
        message:
          "Driver-specific statuses cannot be used for home-service bookings"
      });
    }

    if (
      booking.bookingType === "driver" &&
      status === "in_progress"
    ) {
      return res.status(400).json({
        message:
          "Driver bookings must use driver_arrived and trip_started"
      });
    }

    if (status === "cancelled" && cancellationReason !== undefined) {
      if (
        typeof cancellationReason !== "string" ||
        cancellationReason.length > 500
      ) {
        return res.status(400).json({
          message: "Cancellation reason must be 500 characters or fewer"
        });
      }

      booking.cancellationReason = cancellationReason.trim();
    }

    booking.status = status;
    await booking.save();

    return res.status(200).json({
      message: "Booking status updated",
      booking
    });
  } catch (error) {
    console.error("Update booking error:", error);

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        message: "Invalid booking update",
        error: error.message
      });
    }

    return res.status(500).json({
      message: "Failed to update booking"
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  updateBookingStatus
};