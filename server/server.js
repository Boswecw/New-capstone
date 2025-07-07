// server/server.js - Updated with products route
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");

// Import routes
const petRoutes = require("./routes/pets");
const userRoutes = require("./routes/users");
const contactRoutes = require("./routes/contact");
const adminRoutes = require("./routes/admin");
const productsRoutes = require("./routes/products"); // ✅ ADD THIS LINE

// Optional GCS route setup
let gcsRoutes;
try {
  gcsRoutes = require("./routes/gcs");
} catch (error) {
  console.warn("⚠️  GCS routes not found. Image upload will be limited.");
  gcsRoutes = null;
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Required environment variables check
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined. Check your .env file.");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not defined. Check your .env file.");
  process.exit(1);
}

if (
  !process.env.GOOGLE_CLOUD_PROJECT_ID ||
  !process.env.GOOGLE_CLOUD_KEY_FILE
) {
  console.warn(
    "⚠️  GCS configuration is incomplete. Image upload will not work."
  );
}

// Connect to MongoDB
console.log("🔌 Connecting to MongoDB...");
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("✅ Connected to MongoDB Atlas");
  console.log("🗃️  Database name:", mongoose.connection.db.databaseName); // ADD THIS LINE
});

if (process.env.NODE_ENV === "production") {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, "../client/build")));

  // Catch all handler for React Router
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}

// API routes
app.use("/api/pets", petRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productsRoutes); // ✅ ADD THIS LINE

if (gcsRoutes) {
  app.use("/api/gcs", gcsRoutes);
  console.log("✅ GCS routes enabled");
}

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    environment: process.env.NODE_ENV || "development",
    gcs: {
      configured: !!(
        process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_KEY_FILE
      ),
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || "Not configured",
    },
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Multer error: ${err.message}`,
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Duplicate field value entered",
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Token expired" });
  }

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Graceful shutdown
["SIGTERM", "SIGINT"].forEach((signal) =>
  process.on(signal, () => {
    console.log(`${signal} received. Closing MongoDB connection...`);
    mongoose.connection.close(() => {
      console.log("MongoDB disconnected.");
      process.exit(0);
    });
  })
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Env: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🗃️  GCS configured: ${!!(
      process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_KEY_FILE
    )}`
  );
  console.log(`🛒 Products API: http://localhost:${PORT}/api/products`); // ✅ ADD THIS LINE
});
