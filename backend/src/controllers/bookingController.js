const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const ServiceProvider = require("../models/ServiceProvider");
const User = require("../models/User");
const Review = require("../models/Review");
const { canTransitionBookingStatus } = require("../utils/workflowRules");

const ACTIVE_STATUSES = [
  "pending",
  "accepted",
  "in_progress",
  "driver_arrived",
  "trip_started"
];

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
      serviceDescription,
      customerPhone,
      note
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

    let contactPhone = String(customer.phone || "").trim();

    if (customerPhone !== undefined && String(customerPhone).trim()) {
      const digits = String(customerPhone).replace(/\D/g, "");

      if (typeof customerPhone !== "string" || digits.length < 10 || digits.length > 15) {
        return res.status(400).json({
          message: "Enter a contact number with 10 to 15 digits"
        });
      }

      contactPhone = customerPhone.trim();
    }

    const bookingNote = typeof note === "string" ? note.trim().slice(0, 1000) : "";

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
      availability: "available"
    };

    // Nothing in the app can verify a provider yet, so verification is only
    // required when REQUIRE_VERIFIED_PROVIDERS=true is set in backend/.env.
    if (process.env.REQUIRE_VERIFIED_PROVIDERS === "true") {
      providersQuery.verificationStatus = "verified";
    }

    if (providerId) {
      if (!mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(400).json({ message: "Invalid provider ID" });
      }
      providersQuery._id = providerId;
    }

    const candidates = await ServiceProvider.find(providersQuery)
      .populate("user", "name phone city address")
      .sort({ averageRating: -1, completedJobs: -1 });

    const start = scheduledDate.getTime();
    const end = start + duration * 60 * 1000;

    let provider = null;

    // Check candidates for exact match without time conflict
    for (const candidate of candidates) {
      if (String(candidate.user?._id) === String(req.user._id)) continue;

      const profileCity = (candidate.serviceAreas || []).map(normalize);
      const userCity = normalize(candidate.user?.city);
      const requestedCity = normalize(bookingCity);
      const cityMatches = profileCity.includes(requestedCity) || userCity === requestedCity;
      if (!cityMatches || (service && !canPerformService(candidate, service))) continue;

      const nearbyBookings = await Booking.find({
        provider: candidate._id,
        status: { $in: ACTIVE_STATUSES },
        scheduledAt: {
          $gte: new Date(start - 24 * 60 * 60 * 1000),
          $lt: new Date(end)
        }
      }).select("scheduledAt durationMinutes").lean();

      const overlap = nearbyBookings.some((existing) => {
        const existingStart = new Date(existing.scheduledAt).getTime();
        const existingEnd = existingStart + (existing.durationMinutes || 60) * 60 * 1000;
        return start < existingEnd && existingStart < end;
      });

      if (!overlap) {
        provider = candidate;
        break;
      }
    }

    // Fallback 1: Match provider in city without conflict
    if (!provider) {
      for (const candidate of candidates) {
        if (String(candidate.user?._id) === String(req.user._id)) continue;
        const profileCity = (candidate.serviceAreas || []).map(normalize);
        const userCity = normalize(candidate.user?.city);
        const requestedCity = normalize(bookingCity);
        if (profileCity.includes(requestedCity) || userCity === requestedCity) {
          provider = candidate;
          break;
        }
      }
    }

    // Fallback 2: Any available provider of this type
    if (!provider) {
      provider = candidates.find(c => String(c.user?._id) !== String(req.user._id));
    }

    if (!provider) {
      return res.status(409).json({
        message: `No ${process.env.REQUIRE_VERIFIED_PROVIDERS === "true" ? "verified, " : ""}available ${bookingType === "driver" ? "driver" : "professional"} is currently listed for ${bookingCity}.`
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
      customerPhone: contactPhone,
      note: bookingNote || undefined,
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
      .sort({ createdAt: -1 })
      .lean();

    // Attach the customer's review (if any) so the UI knows whether to offer one.
    const reviews = await Review.find({
      booking: { $in: bookings.map((booking) => booking._id) }
    }).select("booking rating comment").lean();

    const reviewByBooking = new Map(
      reviews.map((review) => [String(review.booking), review])
    );

    const withReviews = bookings.map((booking) => ({
      ...booking,
      review: reviewByBooking.get(String(booking._id)) || null
    }));

    return res.status(200).json({
      count: withReviews.length,
      bookings: withReviews
    });
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
    const isProvider = Boolean(
      profile && booking.provider.toString() === profile._id.toString()
    );

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

    // Shared rules live in utils/workflowRules.js (also blocks driver-only
    // statuses on home services and vice versa).
    if (!canTransitionBookingStatus(booking.bookingType, booking.status, status)) {
      return res.status(400).json({
        message: `Cannot change booking from ${booking.status} to ${status}`
      });
    }

    const update = { status };

    if (status === "cancelled" && typeof cancellationReason === "string") {
      update.cancellationReason = cancellationReason.slice(0, 500).trim();
    }

    // Conditional update: two quick clicks cannot apply the same change twice,
    // which also means completedJobs can never be incremented twice.
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: booking.status },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(409).json({
        message: "This booking just changed. Refresh and try again."
      });
    }

    if (status === "completed") {
      await ServiceProvider.updateOne(
        { _id: booking.provider },
        { $inc: { completedJobs: 1 } }
      );
    }

    return res.status(200).json({
      message: "Booking status updated",
      booking: updated
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