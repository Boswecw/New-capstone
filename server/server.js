const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();

// 🔧 Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🛠 MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// 🔌 Route imports
const userRoutes = require('./routes/users');
const petRoutes = require('./routes/pets');
const productRoutes = require('./routes/products');
const contactRoutes = require('./routes/contact'); // ✅ FIXED: Correct file name
const adminRoutes = require('./routes/admin');
const adminPetsRoutes = require('./routes/adminPets');

// 🛣 Route mounting
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/products', productRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/pets', adminPetsRoutes);

// 📦 Serve static assets (if applicable)
app.use('/public', express.static(path.join(__dirname, 'public')));

// 🌐 Root health check
app.get('/', (req, res) => {
  res.send('FurBabies API is running...');
});

// 🟢 Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
