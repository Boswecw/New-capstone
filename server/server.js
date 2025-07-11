// server/server.js - Complete updated version with news routes
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

// Import routes
const petRoutes = require("./routes/pets");
const userRoutes = require("./routes/users");
const contactRoutes = require("./routes/contact");
const adminRoutes = require("./routes/admin");
const productsRoutes = require("./routes/products");
const newsRoutes = require("./routes/news"); // ✅ NEW: News routes

// Import models
const Pet = require("./models/Pet");
const Product = require("./models/Product");

const app = express();
const PORT = process.env.PORT || 5000;

// ===== CORS CONFIGURATION =====
// In your server/server.js - Update CORS configuration for Render

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      // Local development
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5000",

      // Replace with your actual Render URLs
      "https://furbabies-frontend.onrender.com", // ⚠️ UPDATE THIS
      "https://furbabies-backend.onrender.com", // ⚠️ UPDATE THIS

      // Environment variables (recommended)
      process.env.FRONTEND_URL,
      process.env.APP_URL,
    ].filter(Boolean);

    console.log("🌍 CORS Check - Origin:", origin);
    console.log("🌍 CORS Check - Allowed:", allowedOrigins);

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log("✅ CORS: Origin allowed");
      callback(null, true);
    } else {
      console.log("❌ CORS: Origin blocked");
      // For debugging: temporarily allow all origins (REMOVE IN PRODUCTION)
      // callback(null, true);
      callback(new Error("Not allowed by CORS"));
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

app.use(cors(corsOptions));

// ===== MIDDLEWARE =====
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security headers
app.use((req, res, next) => {
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  next();
});

// ===== DATABASE CONNECTION =====
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

connectDB();

// ===== ENHANCED DEBUGGING ROUTES =====
// These routes help debug specific pet/product lookup issues
app.get("/api/debug/pets/:id", async (req, res) => {
  try {
    const petId = req.params.id;
    console.log(`🐛 DEBUG ROUTE: Analyzing pet ${petId}`);

    const debugInfo = {
      searchedId: petId,
      timestamp: new Date().toISOString(),
      tests: {},
    };

    const tests = [
      { name: "findById", method: () => Pet.findById(petId) },
      { name: "findOne_id", method: () => Pet.findOne({ _id: petId }) },
      {
        name: "findOne_name",
        method: () => Pet.findOne({ name: `Pet ${petId.substring(1)}` }),
      },
      {
        name: "raw_collection",
        method: async () => {
          const collection = mongoose.connection.db.collection("pets");
          return await collection.findOne({ _id: petId });
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = await test.method();
        debugInfo.tests[test.name] = {
          success: !!result,
          found: result ? { id: result._id, name: result.name } : null,
        };
      } catch (error) {
        debugInfo.tests[test.name] = {
          success: false,
          error: error.message,
        };
      }
    }

    debugInfo.stats = {
      totalPets: await Pet.countDocuments(),
      petsWithSimilarId: await Pet.countDocuments({
        _id: new RegExp(petId.substring(1)),
      }),
      petsWithSimilarName: await Pet.countDocuments({
        name: new RegExp(petId.replace("pet_", "")),
      }),
    };

    return res.json({
      success: true,
      debug: debugInfo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      debug: { searchedId: req.params.id },
    });
  }
});

app.get("/api/debug/products/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`🐛 DEBUG ROUTE: Analyzing product ${productId}`);

    const debugInfo = {
      searchedId: productId,
      timestamp: new Date().toISOString(),
      tests: {},
    };

    const tests = [
      { name: "findById", method: () => Product.findById(productId) },
      { name: "findOne_id", method: () => Product.findOne({ _id: productId }) },
      {
        name: "findOne_name",
        method: () =>
          Product.findOne({ name: `Product ${productId.substring(1)}` }),
      },
      {
        name: "raw_collection",
        method: async () => {
          const collection = mongoose.connection.db.collection("products");
          return await collection.findOne({ _id: productId });
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = await test.method();
        debugInfo.tests[test.name] = {
          success: !!result,
          found: result
            ? { id: result._id, name: result.name, price: result.price }
            : null,
        };
      } catch (error) {
        debugInfo.tests[test.name] = {
          success: false,
          error: error.message,
        };
      }
    }

    debugInfo.stats = {
      totalProducts: await Product.countDocuments(),
      productsWithSimilarId: await Product.countDocuments({
        _id: new RegExp(productId.substring(5)),
      }),
      productsWithSimilarName: await Product.countDocuments({
        name: new RegExp(productId.replace("prod_", "")),
      }),
    };

    return res.json({
      success: true,
      debug: debugInfo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      debug: { searchedId: req.params.id },
    });
  }
});

// ===== API ROUTES =====
app.use("/api/pets", petRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/news", newsRoutes); // ✅ NEW: News routes integration

// ===== HEALTH CHECK ROUTE =====
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    environment: process.env.NODE_ENV || "development",
    version: "1.2.0", // Updated version
    features: [
      "Enhanced pet search with 7 different methods",
      "Enhanced product search with 7 different methods",
      "News API with categories and articles", // ✅ NEW
      "Comprehensive error debugging",
      "Raw MongoDB collection fallback",
      "Case-insensitive ID matching",
    ],
    cors: {
      allowedOrigins: [
        "https://furbabies-frontend.onrender.com",
        "http://localhost:3000",
        "http://localhost:3001",
        process.env.APP_URL,
        process.env.FRONTEND_URL,
      ].filter(Boolean),
    },
  });
});

// ===== ROOT ROUTE =====
app.get("/", (req, res) => {
  res.json({
    message: "FurBabies API Server - Enhanced Version with News",
    version: "1.2.0",
    status: "running",
    features: [
      "Enhanced pet search with 7 different methods",
      "Enhanced product search with 7 different methods",
      "News API with categories and articles", // ✅ NEW
      "Comprehensive error debugging",
      "Raw MongoDB collection fallback",
      "Case-insensitive ID matching",
    ],
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      pets: "/api/pets",
      users: "/api/users",
      contact: "/api/contact",
      admin: "/api/admin",
      products: "/api/products",
      news: "/api/news", // ✅ NEW
      newsCategories: "/api/news/categories", // ✅ NEW
      debugPets: "/api/debug/pets/:id",
      debugProducts: "/api/debug/products/:id",
    },
  });
});

// ===== ERROR HANDLING MIDDLEWARE =====
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      timestamp: new Date().toISOString(),
    }),
  });

  next();
});

// ===== 404 HANDLER FOR UNDEFINED ROUTES =====
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      "GET /api/health",
      "GET /api/pets",
      "GET /api/pets/:id",
      "GET /api/products",
      "GET /api/products/:id",
      "GET /api/news", // ✅ NEW
      "GET /api/news/categories", // ✅ NEW
      "GET /api/news/:id", // ✅ NEW
      "POST /api/users/register",
      "POST /api/users/login",
      "POST /api/contact",
      "GET /api/debug/pets/:id",
      "GET /api/debug/products/:id",
    ],
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Enhanced FurBabies Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API available at: http://localhost:${PORT}`);
  console.log(
    `🌐 CORS configured for frontend: https://furbabies-frontend.onrender.com`
  );
  console.log(`🎯 Enhanced routes active:`);
  console.log(`   • /api/pets/:id (7-method pet search)`);
  console.log(`   • /api/products/:id (7-method product search)`);
  console.log(`   • /api/news (news articles API)`); // ✅ NEW
  console.log(`   • /api/news/categories (news categories)`); // ✅ NEW
  console.log(`🐛 Debug routes available:`);
  console.log(`   • /api/debug/pets/:id`);
  console.log(`   • /api/debug/products/:id`);
  console.log(
    `✨ Features: Custom ID support, comprehensive debugging, news API`
  );
});

module.exports = app;
