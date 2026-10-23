const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: true,
      index: true
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      index: true
    },

    bookingType: {
      type: String,
      enum: ["home_service", "driver"],
      required: true
    },

    scheduledAt: {
      type: Date,
      required: true
    },

    city: {
      type: String,
      trim: true,
      index: true
    },

    customerPhone: {
      type: String,
      trim: true
    },

    providerPhone: {
      type: String,
      trim: true
    },

    durationMinutes: {
      type: Number,
      min: 15,
      max: 1440,
      default: 60
    },

    address: {
      type: String,
      trim: true
    },

    serviceDescription: {
      type: String,
      trim: true
    },

    trip: {
      pickup: { type: String, trim: true },
      destination: { type: String, trim: true },

      tripType: {
        type: String,
        enum: ["one_way", "round_trip", "hourly"]
      },

      vehicleTransmission: {
        type: String,
        enum: ["manual", "automatic"]
      }
    },

    quotedPrice: {
      type: Number,
      min: 0
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "in_progress",
        "driver_arrived",
        "trip_started",
        "completed",
        "cancelled"
      ],
      default: "pending",
      index: true
    },

    cancellationReason: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

bookingSchema.index({
  provider: 1,
  scheduledAt: 1,
  status: 1
});

module.exports = mongoose.model("Booking", bookingSchema);