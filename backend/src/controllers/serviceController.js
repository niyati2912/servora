const mongoose = require("mongoose");
const Service = require("../models/Service");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/services
// Optional query parameters:
// providerType, category, q, page, limit
const getServices = async (req, res) => {
  try {
    const filter = {
      isActive: true
    };

    const { providerType, category, q } = req.query;

    if (providerType) {
      if (!["home_service", "driver"].includes(providerType)) {
        return res.status(400).json({
          message: "providerType must be home_service or driver"
        });
      }

      filter.providerType = providerType;
    }

    if (category) {
      filter.category = {
        $regex: `^${escapeRegex(category)}$`,
        $options: "i"
      };
    }

    if (q && String(q).trim()) {
      const searchRegex = {
        $regex: escapeRegex(String(q).trim()),
        $options: "i"
      };

      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { tags: searchRegex }
      ];
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    // Prevent very large requests.
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20)
    );

    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      Service.find(filter)
        .sort({ category: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Service.countDocuments(filter)
    ]);

    return res.status(200).json({
      count: services.length,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      services
    });
  } catch (error) {
    console.error("Get services error:", error);

    return res.status(500).json({
      message: "Failed to fetch services"
    });
  }
};

// GET /api/services/:id
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid service ID"
      });
    }

    const service = await Service.findOne({
      _id: id,
      isActive: true
    }).lean();

    if (!service) {
      return res.status(404).json({
        message: "Service not found"
      });
    }

    return res.status(200).json({
      service
    });
  } catch (error) {
    console.error("Get service by ID error:", error);

    return res.status(500).json({
      message: "Failed to fetch service"
    });
  }
};

module.exports = {
  getServices,
  getServiceById
};