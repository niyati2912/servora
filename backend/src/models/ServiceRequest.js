const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    requestType: {
      type: String,
      enum: ["home_service", "driver"],
      required: true
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    locality: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300
    },
    trip: {
      pickup: { type: String, trim: true, maxlength: 300 },
      destination: { type: String, trim: true, maxlength: 300 },
      tripType: {
        type: String,
        enum: ["one_way", "round_trip", "hourly"]
      },
      vehicleTransmission: {
        type: String,
        enum: ["manual", "automatic"]
      }
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true
    },
    estimatedPrice: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: [
        "open",
        "accepted",
        "in_progress",
        "completed",
        "cancelled"
      ],
      default: "open",
      index: true
    },
    acceptedProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
      default: null,
      index: true
    },
    acceptedAt: Date
  },
  { timestamps: true }
);

serviceRequestSchema.index({
  status: 1,
  locality: 1,
  requestType: 1,
  scheduledAt: 1
});

serviceRequestSchema.index({ customer: 1, createdAt: -1 });

module.exports = mongoose.model(
  "ServiceRequest",
  serviceRequestSchema
);