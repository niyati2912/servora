const Business = require("../models/Business");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasText = (value) =>
  typeof value === "string" && value.trim().length > 0;

const createBusiness = async (req, res) => {
  try {
    const { name, description, category, address, locality } = req.body;

    if (
      !hasText(name) ||
      !hasText(category) ||
      !hasText(address) ||
      !hasText(locality)
    ) {
      return res.status(400).json({
        message: "Name, category, address, and locality are required"
      });
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({ message: "Description must be text" });
    }

    const business = await Business.create({
      owner: req.user._id,
      name,
      description,
      category,
      address,
      locality
    });

    return res.status(201).json({
      message: "Business created successfully",
      business
    });
  } catch (error) {
    console.error("Create business error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getBusinesses = async (req, res) => {
  try {
    const filter = { isActive: true };

    if (req.query.category) {
      // String() stops query-string objects (category[$ne]=x) reaching Mongo.
      filter.category = String(req.query.category);
    }

    if (req.query.locality) {
      // User input must be escaped before it becomes a regular expression.
      filter.locality = new RegExp(escapeRegex(req.query.locality), "i");
    }

    const businesses = await Business.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      count: businesses.length,
      businesses
    });
  } catch (error) {
    console.error("Get businesses error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMyBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find({ owner: req.user._id })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: businesses.length,
      businesses
    });
  } catch (error) {
    console.error("Get my businesses error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createBusiness, getBusinesses, getMyBusinesses };