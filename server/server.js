const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const petRoutes = require('./routes/pets');
const productRoutes = require('./routes/products');
const contactRoutes = require('./routes/contacts');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const imageRoutes = require('./routes/images');
const newsRoutes = require('./routes/news');

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

// === FIX: Use consistent environment variable ===
const mongoURI = process.env.MONGODB_URI; // CHANGED FROM MONGO_URI
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

// === HEALTH CHECK ROUTE ===
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    corsOrigins: corsOptions.origin
  });
});

// === ROUTES ===
app.get('/', (req, res) => {
  res.send('🌍 FurBabies API is live');
});

app.use('/api/pets', petRoutes);
app.use('/api/products', productRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/news', newsRoutes);

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
});

module.exports = app;