// server/server.js - ENHANCED VERSION with News API
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
const newsRoutes = require("./routes/news"); // 🆕 ADD THIS LINE

// Import models for bypass routes
const Pet = require("./models/Pet");
const Product = require("./models/Product");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for Render
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
    ].filter(Boolean);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
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
  /* eslint-disable no-console */
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log("Origin:", req.get("Origin"));
  console.log("User-Agent:", req.get("User-Agent"));
  /* eslint-enable no-console */
  next();
});

// Environment variables check
if (!process.env.MONGODB_URI) {
  /* eslint-disable no-console */
  console.error("❌ MONGODB_URI is not defined. Check your .env file.");
  /* eslint-enable no-console */
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  /* eslint-disable no-console */
  console.error("❌ JWT_SECRET is not defined. Check your .env file.");
  /* eslint-enable no-console */
  process.exit(1);
}

// Optional: Check for NEWS_API_KEY (not required for basic functionality)
if (!process.env.NEWS_API_KEY) {
  /* eslint-disable no-console */
  console.warn("⚠️ NEWS_API_KEY not found. News API will use sample data.");
  console.warn("📝 Get a free key at: https://newsapi.org/register");
  /* eslint-enable no-console */
}

// Connect to database
connectDB();

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🐾 FurBabies API is running smoothly!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    uptime: `${Math.floor(process.uptime())} seconds`,
    endpoints: {
      pets: "/api/pets",
      products: "/api/products",
      users: "/api/users",
      contact: "/api/contact",
      admin: "/api/admin",
      news: "/api/news" // 🆕 ADD THIS LINE
    }
  });
});

// 🆕 API Routes - ADD news route
app.use("/api/pets", petRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/news", newsRoutes); // 🆕 ADD THIS LINE

// Bypass routes for direct database access (DEVELOPMENT ONLY)
if (process.env.NODE_ENV === "development") {
  console.log("🔧 Development mode: Enabling bypass routes");
  
  // Direct pet access for testing
  app.get("/pets", async (req, res) => {
    try {
      const pets = await Pet.find({ status: "available" }).limit(10);
      res.json({ success: true, data: pets, source: "direct-db" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Direct product access for testing
  app.get("/products", async (req, res) => {
    try {
      const products = await Product.find({ inStock: true }).limit(10);
      res.json({ success: true, data: products, source: "direct-db" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, "../client/build")));

  // Handle React routing - send all requests to React
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Global error handler:", err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      "/api/health",
      "/api/pets",
      "/api/products",
      "/api/users",
      "/api/contact",
      "/api/admin",
      "/api/news" // 🆕 ADD THIS LINE
    ]
  });
});

// Start server
app.listen(PORT, () => {
  /* eslint-disable no-console */
  console.log("🚀 ===========================================");
  console.log(`🐾 FurBabies Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🗄️  Database: ${process.env.MONGODB_URI ? "✅ Connected" : "❌ Not configured"}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? "✅ Configured" : "❌ Missing"}`);
  console.log(`📰 News API: ${process.env.NEWS_API_KEY ? "✅ API Key found" : "⚠️ Using sample data"}`);
  console.log("🚀 ===========================================");
  /* eslint-enable no-console */
});

module.exports = app;