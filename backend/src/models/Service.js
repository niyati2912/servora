const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    providerType: {
      type: String,
      enum: ["home_service", "driver"],
      required: true,
      index: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    pricingType: {
      type: String,
      enum: ["fixed", "hourly", "starting_at", "quote"],
      required: true,
      default: "starting_at"
    },

    basePrice: {
      type: Number,
      min: 0
    },

    estimatedDurationMinutes: {
      type: Number,
      min: 15,
      default: 60
    },

    // Used by driver offerings. Home services can leave this empty.
    tripType: {
      type: String,
      enum: ["one_way", "round_trip", "hourly"]
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true
      }
    ],

    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

serviceSchema.index({
  providerType: 1,
  category: 1,
  isActive: 1
});

module.exports = mongoose.model("Service", serviceSchema);