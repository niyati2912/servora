
const mongoose = require("mongoose");

const driverLicenseSchema = new mongoose.Schema(
  {
    storageName: { type: String, select: false },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date },
    status: {
      type: String,
      enum: ["not_submitted", "pending", "verified", "rejected"],
      default: "not_submitted"
    }
  },
  { _id: false }
);

const serviceProviderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    providerType: {
      type: String,
      enum: ["home_service", "driver"],
      required: true
    },
    skills: [{ type: String, trim: true }],
    serviceCategories: [{ type: String, trim: true }],
    serviceAreas: [{ type: String, trim: true }],
    basePrice: { type: Number, min: 0 },
    availability: {
      type: String,
      enum: ["available", "busy", "unavailable"],
      default: "unavailable"
    },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified"
    },
    driverLicense: {
      type: driverLicenseSchema,
      default: undefined
    },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    completedJobs: { type: Number, min: 0, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceProvider", serviceProviderSchema);
