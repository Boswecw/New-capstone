// ===== 1. MONGOOSE CONNECTION FIX =====
// server/config/database.js - Updated
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    throw new Error('MONGODB_URI must be defined in your .env or Render settings.');
  }

  try {
    // FIXED: Remove deprecated options
    const conn = await mongoose.connect(uri, {
      // Removed useNewUrlParser and useUnifiedTopology - they're deprecated
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: Connected`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

// ===== 2. USER MODEL FIX - Remove Duplicate Indexes =====
// server/models/User.js - Updated schema section
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
  // ... rest of schema
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// FIXED: Single index definitions (remove duplicates)
userSchema.index({ email: 1 }); // Only define once
userSchema.index({ username: 1 }); // Only define once
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// ===== 3. REGISTRATION ROUTE FIX =====
// server/routes/auth.js - Fixed registration
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  console.log('🔍 Registration attempt for:', req.body.email);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Registration validation errors:', errors.array());
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ Registration failed - email already exists:', email);
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // FIXED: Generate unique username from email
    const generateUsernameFromEmail = (email) => {
      return email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    };

    const ensureUniqueUsername = async (baseUsername) => {
      let username = baseUsername;
      let counter = 1;
      
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      return username;
    };

    const baseUsername = generateUsernameFromEmail(email);
    const uniqueUsername = await ensureUniqueUsername(baseUsername);
    console.log('📝 Generated username:', uniqueUsername);

    // Create new user
    const user = new User({
      name,
      username: uniqueUsername, // FIXED: Always include username
      email,
      password,
      role: 'user',
      isActive: true
    });

    const savedUser = await user.save();
    console.log('✅ User created successfully:', savedUser.email);

    // Generate JWT token
    const token = jwt.sign(
      { id: savedUser._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role
      }
    });

    console.log('✅ Registration response sent successfully');

  } catch (error) {
    console.error('❌ Registration error occurred:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({ 
        success: false, 
        message: `${field === 'email' ? 'Email' : 'Username'} already registered` 
      });
    }

    if (error.name === 'ValidationError') {
      console.error('❌ Mongoose validation error:', error.errors);
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// ===== 4. ANALYTICS ROUTE FIX - Prevent Circular JSON =====
// server/routes/admin.js - Fixed analytics endpoint
router.get('/analytics', protect, admin, async (req, res) => {
  try {
    const { range = '30days' } = req.query;
    console.log('📊 Fetching analytics for range:', range);

    // Calculate date range
    const now = new Date();
    const daysBack = range === '7days' ? 7 : range === '30days' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Parallel queries for better performance
    const [
      totalPets,
      totalUsers,
      totalContacts,
      recentPets,
      recentUsers,
      recentContacts
    ] = await Promise.all([
      Pet.countDocuments(),
      User.countDocuments({ role: { $ne: 'admin' } }),
      Contact.countDocuments(),
      Pet.find({ createdAt: { $gte: startDate } }).countDocuments(),
      User.find({ 
        createdAt: { $gte: startDate },
        role: { $ne: 'admin' }
      }).countDocuments(),
      Contact.find({ createdAt: { $gte: startDate } }).countDocuments()
    ]);

    // FIXED: Create clean analytics object (no circular references)
    const analyticsData = {
      success: true,
      data: {
        overview: {
          totalPets,
          totalUsers,
          totalContacts,
          totalAdoptions: 0, // Calculate if you have adoption data
          conversionRate: '0.0'
        },
        trends: {
          newPets: recentPets,
          newUsers: recentUsers,
          newContacts: recentContacts
        },
        performanceMetrics: [],
        popularPets: [],
        recentActivity: [],
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString(),
          days: daysBack
        }
      }
    };

    console.log('✅ Analytics data compiled successfully');
    res.json(analyticsData);

  } catch (error) {
    console.error('❌ Analytics error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== 5. LOGIN ROUTE FIX - Handle JSON Parsing =====
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  console.log('🔍 Login attempt for email:', req.body.email);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Login validation errors:', errors.array());
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  const { email, password } = req.body;

  try {
    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    console.log('🔍 User lookup result:', user ? 'Found' : 'Not found');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated. Please contact support.' 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔐 Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

    console.log('✅ Login successful for:', user.email);

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// ===== 6. CLIENT-SIDE ADMIN DASHBOARD SYNTAX FIX =====
// client/src/pages/admin/AdminDashboard.js - Fix duplicate 'alerts' key
const mappedData = {
  stats: {
    totalPets: backendData.stats?.pets?.total || 0,
    availablePets: backendData.stats?.pets?.available || 0,
    adoptedPets: backendData.stats?.pets?.adopted || 0,
    pendingPets: backendData.stats?.pets?.pending || 0,
    totalProducts: backendData.stats?.products?.total || 0,
    totalUsers: backendData.stats?.users?.total || 0,
    recentAdoptions: backendData.stats?.pets?.adopted || 0
  },
  recentPets: Array.isArray(backendData.recentActivity?.pets) ? backendData.recentActivity.pets : [],
  recentUsers: Array.isArray(backendData.recentActivity?.users) ? backendData.recentActivity.users : [],
  recentContacts: Array.isArray(backendData.recentActivity?.contacts) ? backendData.recentActivity.contacts : [],
  alerts: Array.isArray(backendData.alerts) ? backendData.alerts : [] // FIXED: Only define once
};