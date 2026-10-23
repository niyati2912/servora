const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 24
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100,
      index: true
    },
    roles: {
      type: [{
        type: String,
        enum: ["customer", "provider", "driver", "employer", "admin"]
      }],
      default: ["customer"]
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);