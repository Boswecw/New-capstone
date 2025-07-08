// server/server.js - Fixed for separate deployment
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") }); // ✅ FIXED: Look for .env in server directory

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");

// ✅ IMPORT DATABASE CONNECTION
const connectDB = require("../config/db"); // Import the fixed db.js

// Import routes
const petRoutes = require("./routes/pets");
const userRoutes = require("./routes/users");
const contactRoutes = require("./routes/contact");
const adminRoutes = require("./routes/admin");
const productsRoutes = require("./routes/products");

// ✅ UPDATED: GCS routes for public bucket access
let gcsRoutes;
try {
  gcsRoutes = require("./routes/gcs");
  console.log("✅ GCS routes loaded for public bucket access");
} catch (error) {
  console.warn("⚠️  GCS routes not found. Image features will be limited.");
  gcsRoutes = null;
}

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ FIXED: CORS configuration for separate deployments
const corsOptions = {
  origin: [
    'http://localhost:3000',  // Local development
    'https://furbabies-frontend.onrender.com',  // ✅ Your actual frontend domain
    process.env.APP_URL || 'https://furbabies-frontend.onrender.com'  // ✅ Use from .env
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
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

// ✅ SINGLE DATABASE CONNECTION
connectDB(); // Use the config/db.js connection

// ✅ REMOVED: Duplicate mongoose.connect() call that was causing conflicts

// API routes
app.use("/api/pets", petRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", userRoutes); // ✅ ADDED: Map /auth to userRoutes for frontend compatibility
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productsRoutes);

if (gcsRoutes) {
  app.use("/api/gcs", gcsRoutes);
  console.log("✅ GCS routes enabled for public bucket access");
} else {
  console.log("ℹ️  GCS routes not available - image features limited");
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
      enabled: !!gcsRoutes,
      type: "public-bucket-access"
    },
  });
});

// ✅ ADDED: Root route for API-only server
app.get("/", (req, res) => {
  res.json({
    message: "FurBabies API Server",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      pets: "/api/pets",
      users: "/api/users",
      contact: "/api/contact",
      admin: "/api/admin",
      products: "/api/products"
    }
  });
});

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
  console.log(`🗃️  GCS: ${gcsRoutes ? "✅ Public bucket access enabled" : "❌ Not available"}`);
  console.log(`🛒 Products API: http://localhost:${PORT}/api/products`);
  console.log(`🔗 API available at: http://localhost:${PORT}`);
});