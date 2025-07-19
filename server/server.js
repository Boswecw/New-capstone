// server/server.js - MAIN ENTRY POINT
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// === IMPORT ROUTES ===
const petRoutes = require('./routes/pets');
const productRoutes = require('./routes/products');
const contactRoutes = require('./routes/contacts');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const imageRoutes = require('./routes/images');
const newsRoutes = require('./routes/news');

// === APP INITIALIZATION ===
const app = express();

// === MIDDLEWARE ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// === DATABASE CONNECTION ===
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

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

// === PORT CONFIGURATION ===
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  if (process.env.NEWS_API_KEY) {
    console.log('📰 NewsAPI key loaded (backend only)');
  } else {
    console.warn('⚠️ NEWS_API_KEY not set in environment');
  }
});

module.exports = app;