const mongoose = require("mongoose");
const ServiceRequest = require("../models/ServiceRequest");
const ServiceProvider = require("../models/ServiceProvider");

const {
  canTransitionServiceRequestStatus
} = require("../utils/workflowRules");

const validTypes = ["home_service", "driver"];
const validTripTypes = ["one_way", "round_trip", "hourly"];

const hasText = value =>
  typeof value === "string" && value.trim().length > 0;

const escapeRegex = value =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Public browsing must not expose precise addresses or trip endpoints.
const publicFields =
  "requestType category title description locality scheduledAt estimatedPrice status createdAt trip.tripType trip.vehicleTransmission";

async function browseServiceRequests(req, res) {
  try {
    const filter = {
      status: "open",
      scheduledAt: { $gt: new Date() }
    };

    if (validTypes.includes(req.query.requestType)) {
      filter.requestType = req.query.requestType;
    }

    if (hasText(req.query.category)) {
      filter.category = new RegExp(
        escapeRegex(req.query.category.trim()),
        "i"
      );
    }

    if (hasText(req.query.locality)) {
      filter.locality = new RegExp(
        escapeRegex(req.query.locality.trim()),
        "i"
      );
    }

    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 30;

    const requests = await ServiceRequest.find(filter)
      .select(publicFields)
      .sort({ scheduledAt: 1, createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ count: requests.length, requests });
  } catch (error) {
    console.error("Browse service requests:", error.message);
    return res.status(500).json({
      message: "Unable to load service requests"
    });
  }
}

async function createServiceRequest(req, res) {
  try {
    const {
      requestType,
      category,
      title,
      description,
      locality,
      address,
      trip,
      scheduledAt,
      estimatedPrice
    } = req.body;

    if (
      !validTypes.includes(requestType) ||
      !hasText(category) ||
      !hasText(title) ||
      !hasText(description) ||
      !hasText(locality) ||
      !hasText(scheduledAt)
    ) {
      return res.status(400).json({
        message:
          "requestType, category, title, description, locality, and scheduledAt are required"
      });
    }

    const date = new Date(scheduledAt);

    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      return res.status(400).json({
        message: "scheduledAt must be a valid future date"
      });
    }

    if (
      estimatedPrice !== undefined &&
      (
        typeof estimatedPrice !== "number" ||
        !Number.isFinite(estimatedPrice) ||
        estimatedPrice < 0
      )
    ) {
      return res.status(400).json({
        message: "estimatedPrice must be a non-negative number"
      });
    }

    if (requestType === "home_service" && !hasText(address)) {
      return res.status(400).json({
        message: "A service address is required"
      });
    }

    if (requestType === "driver") {
      if (
        !hasText(trip?.pickup) ||
        !hasText(trip?.destination) ||
        !validTripTypes.includes(trip?.tripType)
      ) {
        return res.status(400).json({
          message:
            "Driver requests require pickup, destination, and a valid tripType"
        });
      }

      if (
        trip.vehicleTransmission &&
        !["manual", "automatic"].includes(
          trip.vehicleTransmission
        )
      ) {
        return res.status(400).json({
          message:
            "vehicleTransmission must be manual or automatic"
        });
      }
    }

    const request = await ServiceRequest.create({
      customer: req.user._id,
      requestType,
      category: category.trim(),
      title: title.trim(),
      description: description.trim(),
      locality: locality.trim(),
      address:
        requestType === "home_service"
          ? address.trim()
          : undefined,
      trip: requestType === "driver" ? trip : undefined,
      scheduledAt: date,
      estimatedPrice,
      status: "open"
    });

    return res.status(201).json({
      message: "Service request posted",
      request
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("Create service request:", error.message);
    return res.status(500).json({
      message: "Unable to create service request"
    });
  }
}

async function getMyServiceRequests(req, res) {
  try {
    const clauses = [{ customer: req.user._id }];

    const profile = await ServiceProvider.findOne({
      user: req.user._id
    }).select("_id");

    if (profile) {
      clauses.push({ acceptedProvider: profile._id });
    }

    const requests = await ServiceRequest.find({
      $or: clauses
    })
      .populate("customer", "name")
      .populate({
        path: "acceptedProvider",
        populate: { path: "user", select: "name" }
      })
      .sort({ createdAt: -1 });

    return res.json({ count: requests.length, requests });
  } catch (error) {
    console.error("Get my service requests:", error.message);
    return res.status(500).json({
      message: "Unable to load your service requests"
    });
  }
}

async function acceptServiceRequest(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid service request ID"
      });
    }

    const profile = await ServiceProvider.findOne({
      user: req.user._id
    });

    if (!profile) {
      return res.status(404).json({
        message: "Create a worker profile before accepting requests"
      });
    }

    if (profile.availability !== "available") {
      return res.status(400).json({
        message: "Your profile must be available to accept requests"
      });
    }

    const current = await ServiceRequest.findById(
      req.params.id
    ).select(
      "customer requestType category locality scheduledAt status"
    );

    if (!current) {
      return res.status(404).json({
        message: "Service request not found"
      });
    }

    if (
      current.customer.toString() === req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "You cannot accept your own request"
      });
    }

    if (
      current.status !== "open" ||
      current.scheduledAt <= new Date()
    ) {
      return res.status(409).json({
        message: "This request is no longer available"
      });
    }

    if (profile.providerType !== current.requestType) {
      return res.status(403).json({
        message: "This request does not match your provider type"
      });
    }

    if (
      profile.serviceCategories.length &&
      !profile.serviceCategories.some(
        value =>
          value.trim().toLowerCase() ===
          current.category.trim().toLowerCase()
      )
    ) {
      return res.status(403).json({
        message: "Request category does not match your profile"
      });
    }

    if (
      profile.serviceAreas.length &&
      !profile.serviceAreas.some(
        value =>
          value.trim().toLowerCase() ===
          current.locality.trim().toLowerCase()
      )
    ) {
      return res.status(403).json({
        message: "Request locality is outside your service area"
      });
    }

    // Atomic conditional update: only one worker can claim an
    // open request, even if two workers click Accept together.
    const request = await ServiceRequest.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "open",
        scheduledAt: { $gt: new Date() }
      },
      {
        $set: {
          status: "accepted",
          acceptedProvider: profile._id,
          acceptedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!request) {
      return res.status(409).json({
        message:
          "Another worker accepted this request, or it is no longer available"
      });
    }

    return res.json({
      message: "Service request accepted",
      request
    });
  } catch (error) {
    console.error("Accept service request:", error.message);
    return res.status(500).json({
      message: "Unable to accept service request"
    });
  }
}

async function updateServiceRequestStatus(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid service request ID"
      });
    }

    const { status } = req.body;

    if (
      !["cancelled", "in_progress", "completed"].includes(status)
    ) {
      return res.status(400).json({
        message:
          "status must be cancelled, in_progress, or completed"
      });
    }

    const request = await ServiceRequest.findById(
      req.params.id
    );

    if (!request) {
      return res.status(404).json({
        message: "Service request not found"
      });
    }

    const isCustomer =
      request.customer.toString() === req.user._id.toString();

    const profile = await ServiceProvider.findOne({
      user: req.user._id
    }).select("_id");

    const isAssignedWorker = Boolean(
      profile &&
      request.acceptedProvider &&
      request.acceptedProvider.toString() ===
        profile._id.toString()
    );

    if (status === "cancelled") {
      if (!isCustomer) {
        return res.status(403).json({
          message: "Only the customer can cancel this request"
        });
      }

      if (
        !canTransitionServiceRequestStatus(
          request.status,
          status,
          "customer"
        )
      ) {
        return res.status(400).json({
          message:
            "Only open or accepted requests can be cancelled"
        });
      }
    } else {
      if (!isAssignedWorker) {
        return res.status(403).json({
          message:
            "Only the assigned worker can update this request"
        });
      }

      if (
        !canTransitionServiceRequestStatus(
          request.status,
          status,
          "worker"
        )
      ) {
        return res.status(400).json({
          message: `Cannot change ${request.status} to ${status}`
        });
      }
    }

    // Prevent concurrent status changes from silently overwriting
    // a newer state.
    const updated = await ServiceRequest.findOneAndUpdate(
      { _id: request._id, status: request.status },
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(409).json({
        message: "The request changed; refresh and try again"
      });
    }

    if (status === "completed" && profile) {
      await ServiceProvider.updateOne(
        { _id: profile._id },
        { $inc: { completedJobs: 1 } }
      );
    }

    return res.json({
      message: "Service request status updated",
      request: updated
    });
  } catch (error) {
    console.error("Update service request status:", error.message);
    return res.status(500).json({
      message: "Unable to update service request"
    });
  }
}

module.exports = {
  browseServiceRequests,
  createServiceRequest,
  getMyServiceRequests,
  acceptServiceRequest,
  updateServiceRequestStatus
};