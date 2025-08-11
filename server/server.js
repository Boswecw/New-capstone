const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    throw new Error('MONGODB_URI must be defined');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// CORS configuration
const allowedOrigins = [
  'https://new-capstone.onrender.com',
  'https://furbabies-petstore.onrender.com',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin && origin.match(/https:\/\/.*\.onrender\.com$/)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && origin && origin.includes('localhost')) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Safe route imports
const routes = {};

const safeImport = (name, path) => {
  try {
    routes[name] = require(path);
    console.log(`✅ Loaded ${name} routes`);
  } catch (error) {
    console.warn(`⚠️ Failed to load ${name} routes:`, error.message);
  }
};

// Import routes
safeImport('pets', './routes/pets');
safeImport('products', './routes/products');
safeImport('contact', './routes/contact');
safeImport('users', './routes/users');
safeImport('auth', './routes/auth');
safeImport('admin', './routes/admin');
safeImport('images', './routes/images');
safeImport('news', './routes/news');

// Health check route
app.get('/api/health', (req, res) => {
  const loadedRoutes = Object.keys(routes);
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    loadedRoutes: loadedRoutes,
    routeCount: loadedRoutes.length,
    mongoStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Register routes
if (routes.pets) app.use('/api/pets', routes.pets);
if (routes.products) app.use('/api/products', routes.products);
if (routes.contact) app.use('/api/contact', routes.contact);
if (routes.users) app.use('/api/users', routes.users);
if (routes.auth) app.use('/api/auth', routes.auth);
if (routes.admin) app.use('/api/admin', routes.admin);
if (routes.images) app.use('/api/images', routes.images);
if (routes.news) app.use('/api/news', routes.news);

// Production static files
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.resolve(clientBuildPath, 'index.html'));
    }
  });
}

// Error handling
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: Object.keys(routes).map(route => `/api/${route}`)
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📁 Loaded Routes: ${Object.keys(routes).join(', ')}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;