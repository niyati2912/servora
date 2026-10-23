const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const ServiceProvider = require("../models/ServiceProvider");
const User = require("../models/User");

const ACTIVE_STATUSES = [
  "pending",
  "accepted",
  "in_progress",
  "driver_arrived",
  "trip_started"
];

const TRANSITIONS = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["in_progress", "driver_arrived", "cancelled"],
  driver_arrived: ["trip_started", "cancelled"],
  trip_started: ["completed"],
  in_progress: ["completed"]
};

const normalize = (value) =>
  String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, " ");

const canPerformService = (provider, service) => {
  const capabilities = [
    ...(provider.skills || []),
    ...(provider.serviceCategories || [])
  ].map(normalize).filter(Boolean);

  if (!capabilities.length) return true;

  const terms = [
    service.name,
    service.category,
    ...(service.tags || [])
  ].map(normalize).filter(Boolean);

  return capabilities.some((capability) =>
    terms.some((term) =>
      capability === term ||
      capability.includes(term) ||
      term.includes(capability)
    )
  );
};

const createBooking = async (req, res) => {
  try {
    const {
      serviceId,
      providerId,
      bookingType,
      scheduledAt,
      durationMinutes,
      city,
      address,
      trip,
      serviceDescription
    } = req.body;

    if (!["home_service", "driver"].includes(bookingType)) {
      return res.status(400).json({ message: "Invalid booking type" });
    }

    const scheduledDate = new Date(scheduledAt);

    if (!scheduledAt || Number.isNaN(scheduledDate.getTime()) ||
        scheduledDate <= new Date()) {
      return res.status(400).json({
        message: "Choose a valid future appointment date and time"
      });
    }

    const customer = await User.findById(req.user._id);

    if (!customer) {
      return res.status(401).json({ message: "Customer account not found" });
    }

    const bookingCity = String(city || customer.city || "").trim();

    if (!bookingCity) {
      return res.status(400).json({
        message: "Select a service city"
      });
    }

    let service = null;

    if (serviceId) {
      if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }

      service = await Service.findOne({ _id: serviceId, isActive: true });

      if (!service || service.providerType !== bookingType) {
        return res.status(404).json({
          message: "Selected service is unavailable"
        });
      }
    }

    const duration = Number(
      durationMinutes || service?.estimatedDurationMinutes || 60
    );

    if (!Number.isInteger(duration) || duration < 15 || duration > 1440) {
      return res.status(400).json({
        message: "Duration must be between 15 and 1440 minutes"
      });
    }

    if (bookingType === "home_service" && !String(address || customer.address || "").trim()) {
      return res.status(400).json({ message: "Service address is required" });
    }

    if (
      bookingType === "driver" &&
      (!trip?.pickup || !trip?.destination ||
        !["one_way", "round_trip", "hourly"].includes(trip?.tripType))
    ) {
      return res.status(400).json({
        message: "Driver bookings require pickup, destination and trip type"
      });
    }

    // Customers normally don't select a provider. If a providerId is sent,
    // validate it; otherwise find the first eligible available provider.
    let providersQuery = {
      providerType: bookingType,
      availability: "available",
      verificationStatus: "verified"
    };

    if (providerId) {
      if (!mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(400).json({ message: "Invalid provider ID" });
      }
      providersQuery._id = providerId;
    }

    const candidates = await ServiceProvider.find(providersQuery)
      .populate("user", "name phone city address")
      .sort({ averageRating: -1, completedJobs: -1 });

    const provider = candidates.find((candidate) => {
      const profileCity = (candidate.serviceAreas || []).map(normalize);
      const userCity = normalize(candidate.user?.city);
      const requestedCity = normalize(bookingCity);

      const cityMatches =
        profileCity.includes(requestedCity) || userCity === requestedCity;

      return cityMatches && (!service || canPerformService(candidate, service));
    });

    if (!provider) {
      return res.status(409).json({
        message: `No verified, available ${bookingType === "driver" ? "driver" : "professional"} is currently listed for ${bookingCity}.`
      });
    }

    const start = scheduledDate.getTime();
    const end = start + duration * 60 * 1000;

    const nearbyBookings = await Booking.find({
      provider: provider._id,
      status: { $in: ACTIVE_STATUSES },
      scheduledAt: {
        $gte: new Date(start - 24 * 60 * 60 * 1000),
        $lt: new Date(end)
      }
    }).select("scheduledAt durationMinutes").lean();

    const overlap = nearbyBookings.some((existing) => {
      const existingStart = new Date(existing.scheduledAt).getTime();
      const existingEnd = existingStart +
        (existing.durationMinutes || 60) * 60 * 1000;

      return start < existingEnd && existingStart < end;
    });

    if (overlap) {
      return res.status(409).json({
        message: "This professional is already booked at that time. Please choose another time."
      });
    }

    let quotedPrice;

    if (service && service.pricingType !== "quote" &&
        typeof service.basePrice === "number") {
      quotedPrice = service.pricingType === "hourly"
        ? service.basePrice * Math.ceil(duration / 60)
        : service.basePrice;
    }

    const booking = await Booking.create({
      customer: customer._id,
      provider: provider._id,
      service: service?._id,
      bookingType,
      scheduledAt: scheduledDate,
      durationMinutes: duration,
      city: bookingCity,
      customerPhone: customer.phone || "",
      providerPhone: provider.user?.phone || "",
      address: bookingType === "home_service"
        ? String(address || customer.address || "").trim()
        : undefined,
      serviceDescription: service?.name || serviceDescription || "",
      trip: bookingType === "driver" ? trip : undefined,
      quotedPrice,
      status: "pending"
    });

    const populated = await Booking.findById(booking._id)
      .populate("customer", "name email phone address city")
      .populate({
        path: "provider",
        populate: { path: "user", select: "name phone city" }
      })
      .populate("service", "name category pricingType basePrice");

    return res.status(201).json({
      message: "Appointment booked successfully. Awaiting professional confirmation.",
      booking: populated
    });
  } catch (error) {
    console.error("Create booking error:", error);

    return res.status(500).json({
      message: "Failed to create booking"
    });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const profile = await ServiceProvider.findOne({ user: req.user._id }).select("_id");
    const query = profile
      ? { $or: [{ customer: req.user._id }, { provider: profile._id }] }
      : { customer: req.user._id };

    const bookings = await Booking.find(query)
      .populate("customer", "name email phone address city")
      .populate({
        path: "provider",
        populate: { path: "user", select: "name phone city" }
      })
      .populate("service", "name category pricingType basePrice")
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: bookings.length, bookings });
  } catch (error) {
    console.error("Get bookings error:", error);
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const { status, cancellationReason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const isCustomer = booking.customer.toString() === req.user._id.toString();
    const profile = await ServiceProvider.findOne({ user: req.user._id }).select("_id");
    const isProvider = profile && booking.provider.toString() === profile._id.toString();

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ message: "You cannot modify this booking" });
    }

    if (status === "cancelled" && isCustomer) {
      if (!["pending", "accepted"].includes(booking.status)) {
        return res.status(400).json({
          message: "This booking can no longer be cancelled by the customer"
        });
      }
    } else if (!isProvider) {
      return res.status(403).json({
        message: "Only the assigned professional can perform this action"
      });
    }

    if (!(TRANSITIONS[booking.status] || []).includes(status)) {
      return res.status(400).json({
        message: `Cannot change booking from ${booking.status} to ${status}`
      });
    }

    if (booking.bookingType === "home_service" &&
        ["driver_arrived", "trip_started"].includes(status)) {
      return res.status(400).json({
        message: "Driver statuses cannot be used for home services"
      });
    }

    if (booking.bookingType === "driver" && status === "in_progress") {
      return res.status(400).json({
        message: "Use driver_arrived or trip_started for driver bookings"
      });
    }

    booking.status = status;

    if (status === "cancelled" && typeof cancellationReason === "string") {
      booking.cancellationReason = cancellationReason.slice(0, 500).trim();
    }

    await booking.save();

    return res.status(200).json({
      message: "Booking status updated",
      booking
    });
  } catch (error) {
    console.error("Update booking error:", error);
    return res.status(500).json({ message: "Failed to update booking" });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  updateBookingStatus
};