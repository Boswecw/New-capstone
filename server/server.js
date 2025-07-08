// server/server.js - Fixed CORS Configuration
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

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ IMPROVED: More permissive CORS configuration for Render
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:5000',
      'https://furbabies-frontend.onrender.com',
      'https://furbabies-backend.onrender.com',
      process.env.APP_URL,
      process.env.FRONTEND_URL
    ].filter(Boolean); // Remove undefined values
    
    console.log('🌐 CORS Check - Origin:', origin);
    console.log('🌐 CORS Check - Allowed Origins:', allowedOrigins);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS - Origin allowed');
      callback(null, true);
    } else {
      console.log('❌ CORS - Origin blocked');
      // For debugging: temporarily allow all origins (REMOVE IN PRODUCTION)
      callback(null, true); 
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control'
  ]
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Other middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Origin:', req.get('Origin'));
  console.log('User-Agent:', req.get('User-Agent'));
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

// API routes
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
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    environment: process.env.NODE_ENV || "development",
    cors: {
      allowedOrigins: [
        'https://furbabies-frontend.onrender.com',
        process.env.APP_URL,
        process.env.FRONTEND_URL
      ].filter(Boolean)
    }
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
      products: "/api/products"
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "development" 
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
  console.log(`🌐 CORS configured for frontend: https://furbabies-frontend.onrender.com`);
});

module.exports = app;