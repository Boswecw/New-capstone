// server/server.js - COMPLETE VERSION with bypass route
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import database connection
const connectDB = require("../config/db");

// Import routes
const petRoutes = require("./routes/pets");
const userRoutes = require("./routes/users");
const contactRoutes = require("./routes/contact");
const adminRoutes = require("./routes/admin");
const productsRoutes = require("./routes/products");

// Import Pet model for bypass route
const Pet = require("./models/Pet");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ IMPROVED: More permissive CORS configuration for Render
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5000",
      "https://furbabies-frontend.onrender.com",
      "https://furbabies-backend.onrender.com",
      process.env.APP_URL,
      process.env.FRONTEND_URL,
    ].filter(Boolean); // Remove undefined values

    console.log("🌐 CORS Check - Origin:", origin);
    console.log("🌐 CORS Check - Allowed Origins:", allowedOrigins);

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log("✅ CORS - Origin allowed");
      callback(null, true);
    } else {
      console.log("❌ CORS - Origin blocked");
      // For debugging: temporarily allow all origins (REMOVE IN PRODUCTION)
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
  ],
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

// Other middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log("Origin:", req.get("Origin"));
  console.log("User-Agent:", req.get("User-Agent"));
  next();
});

// Environment variables check
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined. Check your .env file.");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not defined. Check your .env file.");
  process.exit(1);
}

// Database connection
connectDB();

// 🎯 BYPASS ROUTE - This runs BEFORE the pets router and has NO validation
app.get("/api/pets/:id", async (req, res) => {
  try {
    const petId = req.params.id;
    console.log(`🎯 BYPASS ROUTE: Fetching pet ${petId} with NO validation`);

    if (!petId || petId.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Pet ID is required",
      });
    }

    let pet = null;

    try {
      // Try to find the pet directly
      pet = await Pet.findById(petId);
    } catch (mongoError) {
      console.log(`Direct findById failed for ${petId}:`, mongoError.message);
      // Try alternative searches
      try {
        pet = await Pet.findOne({
          $or: [
            { _id: petId },
            { id: petId },
            { petId: petId },
            { customId: petId },
          ],
        });
      } catch (altError) {
        console.log(
          `Alternative search failed for ${petId}:`,
          altError.message
        );
      }
    }

    if (!pet) {
      console.log(`❌ Pet not found: ${petId}`);

      // Show available pets for debugging
      const samplePets = await Pet.find().limit(10).select("_id name type");
      console.log(
        "📋 Available pets:",
        samplePets.map((p) => ({ id: p._id, name: p.name }))
      );

      return res.status(404).json({
        success: false,
        message: "Pet not found",
        debug: {
          searchedId: petId,
          availablePets: samplePets.map((p) => ({
            id: p._id,
            name: p.name,
            type: p.type,
          })),
        },
      });
    }

    // Increment view count
    try {
      pet.views = (pet.views || 0) + 1;
      await pet.save();
    } catch (saveError) {
      console.log("Failed to save view count:", saveError.message);
    }

    console.log(`✅ BYPASS SUCCESS: Found ${pet.name} (${pet.type})`);

    res.json({
      success: true,
      data: pet,
      message: "Pet retrieved successfully",
    });
  } catch (error) {
    console.error("❌ BYPASS ROUTE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pet details",
      error: error.message,
    });
  }
});

// API routes (the bypass route above will intercept /api/pets/:id requests)
app.use("/api/pets", petRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", userRoutes); // Alternative auth route
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productsRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    environment: process.env.NODE_ENV || "development",
    cors: {
      allowedOrigins: [
        "https://furbabies-frontend.onrender.com",
        process.env.APP_URL,
        process.env.FRONTEND_URL,
      ].filter(Boolean),
    },
  });
});

// Root route
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
      products: "/api/products",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API available at: http://localhost:${PORT}`);
  console.log(
    `🌐 CORS configured for frontend: https://furbabies-frontend.onrender.com`
  );
  console.log(`🎯 BYPASS route active for /api/pets/:id`);
});

module.exports = app;
