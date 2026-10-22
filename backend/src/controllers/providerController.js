
const ServiceProvider = require("../models/ServiceProvider");

const createProfile = async (req, res) => {
  try {
    const {
      providerType,
      skills,
      serviceCategories,
      serviceAreas,
      basePrice
    } = req.body;

    if (!["home_service", "driver"].includes(providerType)) {
      return res.status(400).json({
        message: "Invalid provider type"
      });
    }

    const requiredRole =
      providerType === "driver" ? "driver" : "provider";

    if (!req.user.roles.includes(requiredRole)) {
      return res.status(403).json({
        message: `Your account needs the ${requiredRole} role`
      });
    }

    if (
      basePrice !== undefined &&
      (typeof basePrice !== "number" ||
        !Number.isFinite(basePrice) ||
        basePrice < 0)
    ) {
      return res.status(400).json({
        message: "basePrice must be a non-negative number"
      });
    }

    const existing = await ServiceProvider.findOne({
      user: req.user._id
    });

    if (existing) {
      return res.status(409).json({
        message: "Provider profile already exists"
      });
    }

    const profile = await ServiceProvider.create({
      user: req.user._id,
      providerType,
      skills,
      serviceCategories,
      serviceAreas,
      basePrice
    });

    return res.status(201).json({
      message: "Provider profile created",
      profile
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Provider profile already exists"
      });
    }

    console.error("Create provider error:", error.message);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const getProfiles = async (req, res) => {
  try {
    const filter = {};

    if (["home_service", "driver"].includes(req.query.providerType)) {
      filter.providerType = req.query.providerType;
    }

    if (req.query.area) {
      filter.serviceAreas = req.query.area;
    }

    filter.isActive = { $ne: false };

    const profiles = await ServiceProvider.find(filter)
      .populate("user", "name")
      .limit(50)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: profiles.length,
      profiles
    });
  } catch (error) {
    console.error("Get providers error:", error.message);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const profile = await ServiceProvider.findOne({
      user: req.user._id
    });

    if (!profile) {
      return res.status(404).json({
        message: "Provider profile not found"
      });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    console.error("Get my profile error:", error.message);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = {
  createProfile,
  getProfiles,
  getMyProfile
};
