const ServiceProvider = require("../models/ServiceProvider");
const fs = require("fs/promises");
const path = require("path");
const {
  uploadDirectory,
  detectLicenseFileType
} = require("../middleware/uploadDriverLicense");

const PROVIDER_TYPES = ["home_service", "driver"];
const AVAILABILITY = ["available", "busy", "unavailable"];

// ---------------------------------------------------------------------------
// LICENCE-PRESENCE RULE (easy to remove)
// A driver cannot go "available" until a licence file has been uploaded.
// This only checks that a file exists. It does NOT verify the licence.
// To remove the rule: delete this function and the one `if` block in
// createOrUpdateProfile that calls it.
// ---------------------------------------------------------------------------
const hasUploadedLicense = (profile) => Boolean(profile?.driverLicense?.uploadedAt);

// Returns a cleaned array, undefined if the field was not sent, or null if invalid.
const cleanList = (value) => {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 30) return null;

  const cleaned = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    const text = item.trim();
    if (text.length > 100) return null;
    if (text && !cleaned.includes(text)) cleaned.push(text);
  }
  return cleaned;
};

const getProfiles = async (req, res) => {
  try {
    const filter = {};

    if (req.query.providerType) {
      if (!PROVIDER_TYPES.includes(req.query.providerType)) {
        return res.status(400).json({ message: "Invalid provider type" });
      }
      filter.providerType = req.query.providerType;
    }

    if (req.query.availability) {
      if (!AVAILABILITY.includes(req.query.availability)) {
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

    // Public endpoint: never expose licence details or phone numbers.
    const profiles = await ServiceProvider.find(filter)
      .select("-driverLicense")
      .populate("user", "name city")
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
      providerType: requestedType,
      skills,
      serviceCategories,
      serviceAreas,
      basePrice,
      availability
    } = req.body || {};

    const roles = req.user.roles || [];

    // providerType is optional: if the account has exactly one worker role
    // we know which profile it means.
    let providerType = requestedType;

    if (providerType === undefined) {
      const options = [];
      if (roles.includes("provider")) options.push("home_service");
      if (roles.includes("driver")) options.push("driver");

      if (options.length !== 1) {
        return res.status(400).json({ message: "providerType is required" });
      }
      providerType = options[0];
    }

    if (!PROVIDER_TYPES.includes(providerType)) {
      return res.status(400).json({ message: "Invalid provider type" });
    }

    const requiredRole = providerType === "driver" ? "driver" : "provider";

    if (!roles.includes(requiredRole)) {
      return res.status(403).json({
        message: providerType === "driver"
          ? "Only driver accounts can create a driver profile"
          : "Only provider accounts can create a home-service profile"
      });
    }

    const existing = await ServiceProvider.findOne({ user: req.user._id });

    if (existing && existing.providerType !== providerType) {
      return res.status(409).json({
        message: `Your profile is a ${existing.providerType} profile and cannot be changed`
      });
    }

    // Only fields that were actually sent are written, so a partial save
    // (e.g. just the availability toggle) never wipes other data.
    const set = {};
    const unset = {};

    const skillList = cleanList(skills);
    const categoryList = cleanList(serviceCategories);
    const areaList = cleanList(serviceAreas);

    if (skillList === null || categoryList === null || areaList === null) {
      return res.status(400).json({
        message: "skills, serviceCategories and serviceAreas must be lists of short text"
      });
    }

    if (skillList !== undefined) set.skills = skillList;
    if (categoryList !== undefined) set.serviceCategories = categoryList;
    if (areaList !== undefined) set.serviceAreas = areaList;

    if (basePrice !== undefined) {
      if (basePrice === null || basePrice === "") {
        unset.basePrice = "";
      } else {
        const price = Number(basePrice);
        if (!Number.isFinite(price) || price < 0) {
          return res.status(400).json({
            message: "Base price must be a non-negative number"
          });
        }
        set.basePrice = price;
      }
    }

    if (availability !== undefined) {
      if (!AVAILABILITY.includes(availability)) {
        return res.status(400).json({ message: "Invalid availability" });
      }

      // Licence-presence rule (see comment at hasUploadedLicense).
      if (
        availability === "available" &&
        providerType === "driver" &&
        !hasUploadedLicense(existing)
      ) {
        return res.status(400).json({
          message: "Upload your driving licence before you go available."
        });
      }

      set.availability = availability;
    }

    const update = {
      // "user" comes from the query filter on insert
      $setOnInsert: { providerType }
    };
    if (Object.keys(set).length) update.$set = set;
    if (Object.keys(unset).length) update.$unset = unset;

    const profile = await ServiceProvider.findOneAndUpdate(
      { user: req.user._id },
      update,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate("user", "name email phone city address");

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
  const savedFile = req.file || null;
  const discard = () =>
    savedFile?.path ? fs.unlink(savedFile.path).catch(() => {}) : Promise.resolve();

  try {
    if (!req.user.roles?.includes("driver")) {
      await discard();
      return res.status(403).json({
        message: "Only driver accounts can upload a driving licence."
      });
    }

    if (!savedFile) {
      return res.status(400).json({
        message: "Please select a licence file to upload."
      });
    }

    // Check the real file bytes, not just the name/MIME the browser sent.
    const detectedType = await detectLicenseFileType(savedFile.path);

    if (!detectedType) {
      await discard();
      return res.status(400).json({
        message: "That file is not a valid PDF, JPG or PNG."
      });
    }

    // storageName is select:false, so it must be requested explicitly
    // or the previous file could never be found and deleted.
    let profile = await ServiceProvider.findOne({ user: req.user._id })
      .select("+driverLicense.storageName");

    // Works right after signup: create the driver profile if it is missing.
    if (!profile) {
      try {
        await ServiceProvider.create({
          user: req.user._id,
          providerType: "driver"
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
      }

      profile = await ServiceProvider.findOne({ user: req.user._id })
        .select("+driverLicense.storageName");
    }

    if (!profile || profile.providerType !== "driver") {
      await discard();
      return res.status(400).json({
        message: "Your provider profile is not a driver profile."
      });
    }

    const previousStorageName = profile.driverLicense?.storageName;

    profile.driverLicense = {
      storageName: savedFile.filename,
      originalName: path.basename(savedFile.originalname),
      mimeType: detectedType,
      size: savedFile.size,
      uploadedAt: new Date(),
      status: "uploaded"
    };

    await profile.save();

    // Remove the previous private file only after the new reference is saved.
    if (previousStorageName && previousStorageName !== savedFile.filename) {
      await fs
        .unlink(path.join(uploadDirectory, path.basename(previousStorageName)))
        .catch(() => {});
    }

    return res.status(200).json({
      message: "Licence uploaded.",
      driverLicense: {
        originalName: profile.driverLicense.originalName,
        mimeType: profile.driverLicense.mimeType,
        size: profile.driverLicense.size,
        uploadedAt: profile.driverLicense.uploadedAt,
        status: profile.driverLicense.status
      }
    });
  } catch (error) {
    await discard();
    console.error("Driver licence upload error:", error);

    return res.status(500).json({
      message: "Could not save the driving licence."
    });
  }
};

// GET /api/providers/me/driver-license - only the owner can open their file.
const getMyDriverLicenseFile = async (req, res) => {
  try {
    const profile = await ServiceProvider.findOne({ user: req.user._id })
      .select("+driverLicense.storageName");

    const licence = profile?.driverLicense;

    if (!licence?.storageName) {
      return res.status(404).json({ message: "No licence file uploaded yet." });
    }

    const filePath = path.join(uploadDirectory, path.basename(licence.storageName));
    const safeName = String(licence.originalName || "licence")
      .replace(/[^\w.\- ]+/g, "_");

    return res.sendFile(
      filePath,
      {
        headers: {
          "Content-Type": licence.mimeType || "application/octet-stream",
          "Content-Disposition": `inline; filename="${safeName}"`,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "private, no-store"
        }
      },
      (error) => {
        if (error && !res.headersSent) {
          res.status(404).json({ message: "The licence file could not be found." });
        }
      }
    );
  } catch (error) {
    console.error("Get driver licence error:", error);
    return res.status(500).json({ message: "Could not open the licence file." });
  }
};

module.exports = {
  getProfiles,
  getMyProfile,
  createOrUpdateProfile,
  uploadMyDriverLicense,
  getMyDriverLicenseFile
};