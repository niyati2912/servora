const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const providerRoutes = require("./routes/providerRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const jobRoutes = require("./routes/jobRoutes");
const businessRoutes = require("./routes/businessRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const reportRoutes = require("./routes/reportRoutes");
const serviceRequestRoutes = require("./routes/serviceRequestRoutes");
const serviceRoutes = require("./routes/serviceRoutes");

const { protect, authorizeRoles } = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Sevora API is running" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Sevora API"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/service-requests", serviceRequestRoutes);
app.use("/api/services", serviceRoutes);

app.get("/api/auth/me", protect, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone || "",
      address: req.user.address || "",
      city: req.user.city || "",
      roles: req.user.roles
    }
  });
});

app.get(
  "/api/admin/test",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({ message: "Admin access granted" });
  }
);

module.exports = app;