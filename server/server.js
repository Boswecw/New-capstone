const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// === SECURITY MIDDLEWARE ===
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Compression
app.use(compression());

// === CORRECTED CORS CONFIGURATION ===
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://new-capstone.onrender.com',
        'https://furbabies-frontend.onrender.com'  // ✅ Added missing frontend URL
      ]
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// === MIDDLEWARE ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// === MONGODB CONNECTION ===
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

// === ROBUST ROUTE IMPORTS ===
const routes = {};

// Helper function to safely import routes
const safeImport = (routeName, routePath) => {
  try {
    routes[routeName] = require(routePath);
    console.log(`✅ Loaded ${routeName} routes`);
    return true;
  } catch (error) {
    console.warn(`⚠️  Warning: Could not load ${routeName} routes from ${routePath}`);
    console.warn(`   Error: ${error.message}`);
    return false;
  }
};

// Import available routes
safeImport('pets', './routes/pets');
safeImport('products', './routes/products');
safeImport('contacts', './routes/contacts');
safeImport('users', './routes/users');
safeImport('auth', './routes/auth');
safeImport('images', './routes/images');
safeImport('news', './routes/news');

// === HEALTH CHECK ROUTE ===
app.get('/api/health', (req, res) => {
  const loadedRoutes = Object.keys(routes);
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    corsOrigins: corsOptions.origin,
    loadedRoutes: loadedRoutes,
    routeCount: loadedRoutes.length
  });
});

// === ROUTES ===
app.get('/', (req, res) => {
  res.send('🌍 FurBabies API is live');
});

// Register routes only if they were successfully loaded
if (routes.pets) app.use('/api/pets', routes.pets);
if (routes.products) app.use('/api/products', routes.products);
if (routes.contacts) app.use('/api/contacts', routes.contacts);
if (routes.users) app.use('/api/users', routes.users);
if (routes.auth) app.use('/api/auth', routes.auth);
if (routes.images) app.use('/api/images', routes.images);
if (routes.news) app.use('/api/news', routes.news);

// === SERVE STATIC FILES IN PRODUCTION ===
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(clientBuildPath, 'index.html'));
  });
}

// === ERROR HANDLING MIDDLEWARE ===
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// === 404 HANDLER ===
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔐 CORS Origins: ${JSON.stringify(corsOptions.origin)}`);
  console.log(`📁 Loaded Routes: ${Object.keys(routes).join(', ')}`);
});

module.exports = app;