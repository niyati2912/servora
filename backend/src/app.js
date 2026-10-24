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

app.get(
  "/api/admin/test",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({ message: "Admin access granted" });
  }
);

// Unknown /api routes get JSON, not Express's HTML 404 page.
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// JSON error handler (must have 4 arguments so Express treats it as one).
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  // Malformed JSON body -> 400 instead of a 500 with a stack trace.
  if (
    error.type === "entity.parse.failed" ||
    (error instanceof SyntaxError && error.status === 400 && "body" in error)
  ) {
    return res.status(400).json({ message: "Request body is not valid JSON" });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large" });
  }

  console.error("Unhandled error:", error);
  return res.status(500).json({ message: "Internal server error" });
});

module.exports = app;