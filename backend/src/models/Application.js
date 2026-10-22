const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    resumeUrl: {
      type: String,
      trim: true
    },
    coverLetter: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: [
        "submitted",
        "shortlisted",
        "selected",
        "rejected",
        "withdrawn"
      ],
      default: "submitted"
    }
  },
  { timestamps: true }
);

applicationSchema.index(
  { job: 1, applicant: 1 },
  { unique: true }
);

module.exports = mongoose.model("Application", applicationSchema);