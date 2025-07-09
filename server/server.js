// server/server.js - ENHANCED VERSION with comprehensive pet search
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

// 🎯 ENHANCED BYPASS ROUTE - Comprehensive pet search with multiple methods
app.get("/api/pets/:id", async (req, res) => {
  try {
    const petId = req.params.id;
    console.log(`🎯 ENHANCED BYPASS: Fetching pet ${petId}`);

    if (!petId || petId.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Pet ID is required",
      });
    }

    let pet = null;
    let foundWithMethod = null;

    // 🔧 ENHANCED SEARCH - Try multiple approaches
    const searchMethods = [
      {
        name: "Direct findById",
        search: () => Pet.findById(petId)
      },
      {
        name: "String _id match",
        search: () => Pet.findOne({ _id: petId })
      },
      {
        name: "Case insensitive _id",
        search: () => Pet.findOne({ _id: new RegExp(`^${petId}$`, 'i') })
      },
      {
        name: "Alternative fields",
        search: () => Pet.findOne({
          $or: [
            { _id: petId },
            { id: petId },
            { petId: petId },
            { customId: petId },
          ],
        })
      },
      {
        name: "Name-based search",
        search: () => {
          if (petId.startsWith('p') && petId.length >= 3) {
            const petNumber = petId.substring(1);
            const numericPart = parseInt(petNumber);
            if (!isNaN(numericPart)) {
              return Pet.findOne({ name: `Pet ${numericPart}` });
            }
          }
          return null;
        }
      },
      {
        name: "Raw collection search",
        search: async () => {
          try {
            const collection = mongoose.connection.db.collection('pets');
            return await collection.findOne({ _id: petId });
          } catch (err) {
            console.log("Raw collection search failed:", err.message);
            return null;
          }
        }
      },
      {
        name: "Regex pattern search",
        search: () => Pet.findOne({ 
          $or: [
            { _id: new RegExp(petId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
            { name: new RegExp(petId.replace('p', 'Pet '), 'i') }
          ]
        })
      }
    ];

    // Try each search method until we find the pet
    for (let i = 0; i < searchMethods.length; i++) {
      try {
        console.log(`🔍 Method ${i + 1}: ${searchMethods[i].name}...`);
        pet = await searchMethods[i].search();
        if (pet) {
          foundWithMethod = searchMethods[i].name;
          console.log(`✅ SUCCESS with "${foundWithMethod}": Found ${pet.name || pet._id}`);
          break;
        } else {
          console.log(`   ❌ No result`);
        }
      } catch (methodError) {
        console.log(`   ❌ Error: ${methodError.message}`);
        continue;
      }
    }

    if (!pet) {
      console.log(`❌ Pet not found with any method: ${petId}`);

      // Enhanced debug information
      const debugInfo = {
        searchedId: petId,
        searchedWithMethods: searchMethods.length,
        methodsTried: searchMethods.map(m => m.name)
      };
      
      try {
        // Show pets with similar patterns
        const similarPets = await Pet.find({
          $or: [
            { _id: new RegExp(petId.substring(1), 'i') },
            { name: new RegExp(petId.replace('p', 'Pet '), 'i') }
          ]
        }).limit(5).select("_id name type");
        
        debugInfo.similarPets = similarPets.map(p => ({
          id: p._id,
          name: p.name,
          type: p.type,
        }));
      } catch (err) {
        debugInfo.similarPetsError = err.message;
      }
      
      try {
        // Show total count and random sample
        const totalCount = await Pet.countDocuments();
        const samplePets = await Pet.find().limit(10).select("_id name type");
        
        debugInfo.totalPets = totalCount;
        debugInfo.samplePets = samplePets.map(p => ({
          id: p._id,
          name: p.name,
          type: p.type,
        }));

        // Show pets that contain "43" in any field
        if (petId.includes('43')) {
          const pets43 = await Pet.find({
            $or: [
              { _id: /43/ },
              { name: /43/ }
            ]
          }).limit(5).select("_id name type");
          
          debugInfo.petsContaining43 = pets43.map(p => ({
            id: p._id,
            name: p.name,
            type: p.type,
          }));
        }
      } catch (err) {
        debugInfo.statsError = err.message;
      }

      return res.status(404).json({
        success: false,
        message: "Pet not found",
        debug: debugInfo,
      });
    }

    // If we found the pet, ensure it's a proper Mongoose document
    if (pet && typeof pet.save !== 'function') {
      // Convert raw MongoDB document to Mongoose document
      try {
        console.log("🔄 Converting raw document to Mongoose document...");
        const mongoosePet = await Pet.findById(pet._id);
        if (mongoosePet) {
          pet = mongoosePet;
          console.log("✅ Successfully converted to Mongoose document");
        }
      } catch (conversionError) {
        console.log('⚠️ Could not convert to Mongoose document:', conversionError.message);
        // Continue with raw document
      }
    }

    // Increment view count if possible
    try {
      if (pet && typeof pet.save === 'function') {
        pet.views = (pet.views || 0) + 1;
        await pet.save();
        console.log("📈 View count incremented");
      } else {
        console.log("⚠️ Cannot increment view count (raw document)");
      }
    } catch (saveError) {
      console.log("Failed to save view count:", saveError.message);
    }

    console.log(`✅ ENHANCED BYPASS SUCCESS: Found ${pet.name || pet._id} using "${foundWithMethod}"`);

    res.json({
      success: true,
      data: pet,
      message: "Pet retrieved successfully",
      debug: {
        foundWithMethod: foundWithMethod
      }
    });
  } catch (error) {
    console.error("❌ ENHANCED BYPASS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pet details",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 🔧 DEBUG ROUTE - Temporary route to help diagnose issues
app.get("/api/debug/pets/:id", async (req, res) => {
  try {
    const petId = req.params.id;
    console.log(`🐛 DEBUG ROUTE: Analyzing pet ${petId}`);
    
    const debugInfo = {
      searchedId: petId,
      timestamp: new Date().toISOString(),
      tests: {}
    };
    
    // Test various search methods
    const tests = [
      { name: 'findById', method: () => Pet.findById(petId) },
      { name: 'findOne_id', method: () => Pet.findOne({ _id: petId }) },
      { name: 'findOne_name', method: () => Pet.findOne({ name: `Pet ${petId.substring(1)}` }) },
      { name: 'raw_collection', method: async () => {
        const collection = mongoose.connection.db.collection('pets');
        return await collection.findOne({ _id: petId });
      }}
    ];
    
    for (const test of tests) {
      try {
        const result = await test.method();
        debugInfo.tests[test.name] = {
          success: !!result,
          found: result ? { id: result._id, name: result.name } : null
        };
      } catch (error) {
        debugInfo.tests[test.name] = {
          success: false,
          error: error.message
        };
      }
    }
    
    // Additional database stats
    debugInfo.stats = {
      totalPets: await Pet.countDocuments(),
      petsWithSimilarId: await Pet.countDocuments({ _id: new RegExp(petId.substring(1)) }),
      petsWithSimilarName: await Pet.countDocuments({ name: new RegExp(petId.replace('p', 'Pet ')) })
    };
    
    res.json({
      success: true,
      debug: debugInfo
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      debug: { searchedId: req.params.id }
    });
  }
});

// API routes (the enhanced bypass route above will intercept /api/pets/:id requests)
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
    message: "FurBabies API Server - Enhanced Version",
    version: "1.1.0",
    status: "running",
    features: [
      "Enhanced pet search with 7 different methods",
      "Comprehensive error debugging",
      "Raw MongoDB collection fallback",
      "Case-insensitive ID matching"
    ],
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      pets: "/api/pets",
      users: "/api/users",
      contact: "/api/contact",
      admin: "/api/admin",
      products: "/api/products",
      debug: "/api/debug/pets/:id"
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    ...(process.env.NODE_ENV === "development" && { 
      stack: err.stack,
      timestamp: new Date().toISOString()
    }),
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /api/health',
      'GET /api/pets',
      'GET /api/pets/:id',
      'GET /api/debug/pets/:id'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced FurBabies Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API available at: http://localhost:${PORT}`);
  console.log(`🌐 CORS configured for frontend: https://furbabies-frontend.onrender.com`);
  console.log(`🎯 Enhanced bypass route active for /api/pets/:id`);
  console.log(`🐛 Debug route available at: /api/debug/pets/:id`);
  console.log(`✨ Features: 7-method pet search, comprehensive debugging`);
});

module.exports = app;