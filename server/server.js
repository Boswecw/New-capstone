const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

// ✅ Load environment variables if not in production
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Import routes
const petRoutes = require("./routes/pets");
const userRoutes = require("./routes/users");
const contactRoutes = require("./routes/contact");
const adminRoutes = require("./routes/admin");
const productsRoutes = require("./routes/products");
const newsRoutes = require("./routes/news");

// Import database connection
const connectDB = require("../config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ ✅ ✅ ADD THIS: Body parser middleware to read JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== RENDER-OPTIMIZED CORS =====
const corsOptions = {
  origin: function (origin, callback) {
    console.log(`🌍 CORS Check - Origin: ${origin || "none"}`);
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "https://furbabies-frontend.onrender.com",
      "https://furbabies-backend.onrender.com",
      process.env.FRONTEND_URL,
      process.env.CLIENT_URL,
      "http://localhost:3000",
      "http://localhost:3001",
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      console.log("✅ CORS: Origin allowed");
      return callback(null, true);
    } else {
      console.log("❌ CORS: Origin blocked - TEMP ALLOWING for debug");
      return callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Additional manual CORS headers for debugging
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.get("Origin") || "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS,PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

// Security headers
app.use((req, res, next) => {
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  next();
});

// ✅ Set JSON response for all /api routes
app.use("/api", (req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

// ===== CONNECT TO DATABASE =====
connectDB();

// ===== DEBUG ROUTES =====
app.get("/api/debug/render", (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      FRONTEND_URL: process.env.FRONTEND_URL,
      CLIENT_URL: process.env.CLIENT_URL,
      DATABASE_STATUS:
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    },
    request: {
      origin: req.get("Origin"),
      method: req.method,
      path: req.path,
      userAgent: req.get("User-Agent"),
      contentType: req.get("Content-Type"),
      authorization: req.get("Authorization") ? "Present" : "Missing",
    },
  });
});

// ===== API ROUTES =====
app.use("/api/pets", petRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/news", newsRoutes);

// ===== HEALTH CHECK =====
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "FurBabies API running on Render",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// ===== ROOT ROUTE =====
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FurBabies API - Render Deployment",
    version: "1.2.1",
    status: "Live",
    timestamp: new Date().toISOString(),
  });
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error(`💥 Server Error:`, err.message);
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ===== 404 HANDLER =====
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
