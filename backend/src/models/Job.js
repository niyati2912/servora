const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    locality: {
      type: String,
      required: true,
      trim: true
    },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "temporary"],
      required: true
    },
    salaryMin: {
      type: Number,
      min: 0
    },
    salaryMax: {
      type: Number,
      min: 0
    },
    expiresAt: Date,
    status: {
      type: String,
      enum: ["open", "closed", "expired"],
      default: "open",
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);