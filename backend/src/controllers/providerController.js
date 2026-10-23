const ServiceProvider = require("../models/ServiceProvider");
const fs = require("fs/promises");
const path = require("path");
const { uploadDirectory } = require("../middleware/uploadDriverLicense");

const getProfiles = async (req, res) => {
  try {
    const filter = {};

    if (req.query.providerType) {
      if (!["home_service", "driver"].includes(req.query.providerType)) {
        return res.status(400).json({ message: "Invalid provider type" });
      }
      filter.providerType = req.query.providerType;
    }

    if (req.query.availability) {
      if (!["available", "busy", "unavailable"].includes(req.query.availability)) {
        return res.status(400).json({ message: "Invalid availability" });
      }
      filter.availability = req.query.availability;
    }

    if (req.query.verified === "true") {
      filter.verificationStatus = "verified";
    }

    if (req.query.area) {
      filter.serviceAreas = {
        $regex: String(req.query.area).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i"
      };
    }

    const profiles = await ServiceProvider.find(filter)
      .populate("user", "name phone city")
      .sort({ averageRating: -1, completedJobs: -1 });

    return res.status(200).json({
      count: profiles.length,
      profiles
    });
  } catch (error) {
    console.error("Get providers error:", error);
    return res.status(500).json({ message: "Failed to fetch providers" });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const profile = await ServiceProvider.findOne({ user: req.user._id })
      .populate("user", "name email phone city address");

    if (!profile) {
      return res.status(404).json({ message: "Provider profile not found" });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    console.error("Get provider profile error:", error);
    return res.status(500).json({ message: "Failed to fetch provider profile" });
  }
};

const createOrUpdateProfile = async (req, res) => {
  try {
    const {
      providerType,
      skills,
      serviceCategories,
      serviceAreas,
      basePrice,
      availability
    } = req.body;

    if (!["home_service", "driver"].includes(providerType)) {
      return res.status(400).json({ message: "Invalid provider type" });
    }

    const profileData = {
      providerType,
      skills: Array.isArray(skills) ? skills : [],
      serviceCategories: Array.isArray(serviceCategories) ? serviceCategories : [],
      serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : [],
      basePrice: Number.isFinite(Number(basePrice)) ? Number(basePrice) : undefined
    };

    if (availability &&
        ["available", "busy", "unavailable"].includes(availability)) {
      profileData.availability = availability;
    }

    const profile = await ServiceProvider.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: profileData,
        $setOnInsert: {
          user: req.user._id,
          verificationStatus: "pending"
        }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate("user", "name email phone city");

    return res.status(200).json({
      message: "Provider profile saved",
      profile
    });
  } catch (error) {
    console.error("Save provider profile error:", error);
    return res.status(500).json({ message: "Failed to save provider profile" });
  }
};

const uploadMyDriverLicense = async (req, res) => {
  let savedFile = null;

  try {
    if (!req.user.roles?.includes("driver")) {
      return res.status(403).json({
        message: "Only registered driver accounts can upload a driving licence."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select a licence file to upload."
      });
    }

    savedFile = req.file;

    const profile = await ServiceProvider.findOne({
      user: req.user._id
    });

    if (!profile || profile.providerType !== "driver") {
      await fs.unlink(savedFile.path).catch(() => {});
      return res.status(400).json({
        message: "Create your driver profile before uploading a licence."
      });
    }

    const previousStorageName = profile.driverLicense?.storageName;

    profile.driverLicense = {
      storageName: savedFile.filename,
      originalName: path.basename(savedFile.originalname),
      mimeType: savedFile.mimetype,
      size: savedFile.size,
      uploadedAt: new Date(),
      status: "pending"
    };

    // Re-review the profile after a new licence is uploaded.
    profile.verificationStatus = "pending";
    profile.availability = "unavailable";

    await profile.save();

    // Remove the previous private file only after the new reference is saved.
    if (previousStorageName && previousStorageName !== savedFile.filename) {
      const previousPath = path.join(
        uploadDirectory,
        path.basename(previousStorageName)
      );
      await fs.unlink(previousPath).catch(() => {});
    }

    return res.status(200).json({
      message: "Licence uploaded. Verification is pending.",
      driverLicense: {
        originalName: profile.driverLicense.originalName,
        uploadedAt: profile.driverLicense.uploadedAt,
        status: profile.driverLicense.status
      }
    });
  } catch (error) {
    if (savedFile?.path) {
      await fs.unlink(savedFile.path).catch(() => {});
    }

    console.error("Driver licence upload error:", error);

    return res.status(500).json({
      message: "Could not save the driving licence."
    });
  }
};
module.exports = {
  getProfiles,
  getMyProfile,
  createOrUpdateProfile,
  uploadMyDriverLicense
};