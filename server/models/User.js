// server/models/User.js - Complete Fixed Version
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  },
  profile: {
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      trim: true
    },
    avatar: {
      type: String,
      default: null
    },
    phone: {
      type: String,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number'],
      trim: true
    },
    dateOfBirth: {
      type: Date
    },
    location: {
      city: {
        type: String,
        trim: true,
        maxlength: [100, 'City cannot exceed 100 characters']
      },
      state: {
        type: String,
        trim: true,
        maxlength: [100, 'State cannot exceed 100 characters']
      },
      country: {
        type: String,
        trim: true,
        maxlength: [100, 'Country cannot exceed 100 characters']
      },
      zipCode: {
        type: String,
        trim: true,
        maxlength: [10, 'Zip code cannot exceed 10 characters']
      }
    },
    preferences: {
      petTypes: [{
        type: String,
        enum: ['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'other']
      }],
      petSizes: [{
        type: String,
        enum: ['small', 'medium', 'large', 'extra-large']
      }],
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        newPets: {
          type: Boolean,
          default: false
        },
        adoptionUpdates: {
          type: Boolean,
          default: true
        }
      }
    }
  },
  favorites: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }],
    alias: 'favoritesPets'
  },
  adoptedPets: [{
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet'
    },
    adoptedAt: {
      type: Date,
      default: Date.now
    }
  }],
  applications: [{
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    }
  }],
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// FIXED: Single index definitions to prevent duplicate warnings
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// Virtual for user's admin status
userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  if (!this.profile?.location) return null;
  
  const { city, state, country, zipCode } = this.profile.location;
  const parts = [city, state, zipCode, country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    console.log('[2025-08-19T11:43:10.629Z] DEBUG: Password not modified, skipping hash');
    return next();
  }

  try {
    console.log(`[${new Date().toISOString()}] DEBUG: User pre-save middleware triggered (isNew: ${this.isNew}, passwordModified: ${this.isModified('password')})`);
    
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    console.log(`[${new Date().toISOString()}] DEBUG: Password hashed successfully`);
    next();
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR: Password hashing failed:`, error);
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log(`[${new Date().toISOString()}] DEBUG: Password comparison initiated`);
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log(`[${new Date().toISOString()}] DEBUG: Password comparison result:`, isMatch);
    return isMatch;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR: Password comparison failed:`, error);
    return false;
  }
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: {
        loginAttempts: 1
      },
      $unset: {
        lockUntil: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we have hit max attempts and it isn't locked already, lock it
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

// Static method to find by username
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase().trim() });
};

// Static method to get active users count
userSchema.statics.getActiveUsersCount = function() {
  return this.countDocuments({ isActive: true, role: { $ne: 'admin' } });
};

// Static method to get recent users
userSchema.statics.getRecentUsers = function(limit = 5, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    createdAt: { $gte: startDate },
    role: { $ne: 'admin' }
  })
  .select('name username email role createdAt')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Export the model
module.exports = mongoose.model('User', userSchema);