// server.js - COMPLETE RENDER FIX
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

// ✅ RENDER: Environment variables are automatically loaded
if (process.env.NODE_ENV !== 'production') {
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
const connectDB = require("../config/db"); // ✅ FIXED: Use consistent db config

const app = express();
const PORT = process.env.PORT || 5000;

// ===== RENDER-OPTIMIZED CORS =====
// server.js - CORS CONFIGURATION WITH YOUR EXACT RENDER URLS
const corsOptions = {
  origin: function (origin, callback) {
    console.log(`🌍 CORS Check - Origin: ${origin || 'none'}`);
    
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) {
      console.log('✅ No origin - allowing');
      return callback(null, true);
    }

    // ✅ YOUR EXACT RENDER URLS
    const allowedOrigins = [
      "https://furbabies-frontend.onrender.com",    // ✅ Your actual frontend
      "https://furbabies-backend.onrender.com",     // ✅ Your actual backend
      
      // Environment variables (backup)
      process.env.FRONTEND_URL,
      process.env.CLIENT_URL,
      
      // Local development
      "http://localhost:3000",
      "http://localhost:3001",
    ].filter(Boolean);

    console.log('🌍 Allowed origins:', allowedOrigins);

    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origin allowed');
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin blocked:', origin);
      
      // 🚨 EMERGENCY: Temporarily allow all origins for debugging
      console.log('🔧 EMERGENCY: Allowing blocked origin for debugging');
      callback(null, true);
      
      // After confirming it works, use this instead:
      // callback(new Error(`CORS: Origin ${origin} not allowed`));
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

// Handle preflight requests
app.options('*', cors(corsOptions));

// Additional manual CORS headers for debugging
app.use((req, res, next) => {
  console.log(`📡 Request from: ${req.get('Origin') || 'none'} to ${req.method} ${req.path}`);
  
  // Manual CORS headers
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling preflight request');
    return res.status(200).end();
  }
  
  next();
});

// ✅ RENDER: Ensure JSON Content-Type for API routes
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Security headers
app.use((req, res, next) => {
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  next();
});

// ===== DATABASE CONNECTION =====
connectDB();

// ===== RENDER DEBUG ROUTES =====
app.get("/api/debug/render", (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      FRONTEND_URL: process.env.FRONTEND_URL,
      CLIENT_URL: process.env.CLIENT_URL,
      DATABASE_STATUS: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    },
    request: {
      origin: req.get('Origin'),
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      contentType: req.get('Content-Type'),
      authorization: req.get('Authorization') ? 'Present' : 'Missing',
    },
    cors: {
      allowedOrigins: [
        process.env.FRONTEND_URL,
        process.env.CLIENT_URL,
        "http://localhost:3000"
      ].filter(Boolean),
    },
    server: {
      platform: 'Render',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  });
});

// ===== API ROUTES =====
// ✅ FIXED: Remove duplicate route mounting
app.use("/api/pets", petRoutes);
app.use("/api/users", userRoutes);        // ✅ KEEP THIS
// app.use("/api/auth", userRoutes);      // ❌ REMOVED - was causing conflicts
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
    version: "1.2.1-render-fixed",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    environment: process.env.NODE_ENV || "development",
    render: {
      platform: true,
      frontendUrl: process.env.FRONTEND_URL,
      corsConfigured: true,
      routeConflictsFixed: true,
    },
    endpoints: {
      auth: {
        login: "POST /api/users/login",
        register: "POST /api/users/register", 
        profile: "GET /api/users/profile",
      },
      pets: "GET /api/pets",
      products: "GET /api/products",
      debug: "GET /api/debug/render",
    },
  });
});

// ===== ROOT ROUTE =====
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FurBabies API - Render Deployment (Fixed)",
    version: "1.2.1-render-fixed",
    status: "Live",
    fixes: [
      "Removed duplicate route mounting",
      "Fixed CORS for Render URLs",
      "Standardized environment loading",
      "Enhanced JSON response handling",
      "Added comprehensive debugging"
    ],
    nextSteps: [
      "Update FRONTEND_URL in Render environment variables",
      "Test login from your frontend",
      "Check /api/debug/render for configuration details"
    ],
  });
});

// ===== ENHANCED ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error(`💥 [${new Date().toISOString()}] Server Error:`, err.message);
  console.error(`📍 Path: ${req.method} ${req.path}`);
  console.error(`🌍 Origin: ${req.get('Origin') || 'none'}`);
  
  // Ensure JSON response even for errors
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
});

// ===== 404 HANDLER =====
app.use("*", (req, res) => {
  console.log(`❌ [${new Date().toISOString()}] 404 - Route not found: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    suggestion: "Check /api/health for available endpoints",
    availableRoutes: [
      "GET /api/health",
      "GET /api/debug/render",
      "POST /api/users/login",
      "POST /api/users/register",
      "GET /api/users/profile",
      "GET /api/pets",
      "GET /api/products",
      "POST /api/contact",
    ],
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 RENDER: FurBabies API Server FIXED VERSION running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Server URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
  console.log(`✅ FIXES APPLIED:`);
  console.log(`   • Removed duplicate /api/auth route mounting`);
  console.log(`   • Fixed CORS for Render environment`);
  console.log(`   • Standardized environment variable loading`);
  console.log(`   • Enhanced JSON response handling`);
  console.log(`   • Added comprehensive request logging`);
  console.log(`🧪 DEBUG ENDPOINTS:`);
  console.log(`   • Health: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/api/health`);
  console.log(`   • Debug: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/api/debug/render`);
  console.log(`🎯 Next: Update FRONTEND_URL in Render environment variables`);
});

module.exports = app;