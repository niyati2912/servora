
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const ServiceProvider = require("../models/ServiceProvider");

// Create a review for a completed booking
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ message: "Valid bookingId is required" });
    }

    const numericRating = Number(rating);

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be an integer from 1 to 5" });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only review your own bookings" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        message: "You can only review a completed booking"
      });
    }

    const review = await Review.create({
      booking: booking._id,
      reviewer: req.user._id,
      provider: booking.provider,
      rating: numericRating,
      comment
    });

    // Recalculate the provider's average rating
    const result = await Review.aggregate([
      { $match: { provider: booking.provider } },
      {
        $group: {
          _id: "$provider",
          averageRating: { $avg: "$rating" }
        }
      }
    ]);

    const averageRating = result.length ? result[0].averageRating : 0;

    await ServiceProvider.findByIdAndUpdate(booking.provider, {
      averageRating: Number(averageRating.toFixed(2))
    });

    return res.status(201).json({
      message: "Review submitted successfully",
      review
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already reviewed this booking"
      });
    }

    console.error("Create review error:", error);
    return res.status(500).json({ message: "Server error while creating review" });
  }
};

// Get reviews for a provider profile
const getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!mongoose.isValidObjectId(providerId)) {
      return res.status(400).json({ message: "Invalid provider ID" });
    }

    const provider = await ServiceProvider.findById(providerId);

    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const reviews = await Review.find({ provider: providerId })
      .populate("reviewer", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      averageRating: provider.averageRating,
      totalReviews: reviews.length,
      reviews
    });
  } catch (error) {
    console.error("Get provider reviews error:", error);
    return res.status(500).json({ message: "Server error while fetching reviews" });
  }
};

module.exports = {
  createReview,
  getProviderReviews
};
