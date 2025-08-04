// server/models/User.js - ENHANCED WITH DEBUG LOGGING
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in query results by default
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin', 'moderator'],
      message: 'Role must be user, admin, or moderator'
    },
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profile: {
    avatar: {
      type: String,
      default: 'https://via.placeholder.com/150x150?text=User'
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [200, 'Bio cannot exceed 200 characters']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    address: {
      street: {
        type: String,
        trim: true,
        maxlength: [100, 'Street address cannot exceed 100 characters']
      },
      city: {
        type: String,
        trim: true,
        maxlength: [50, 'City cannot exceed 50 characters']
      },
      state: {
        type: String,
        trim: true,
        maxlength: [50, 'State cannot exceed 50 characters']
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
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet'
  }],
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

// Indexes for better query performance
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for user's admin status
userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for full name display
userSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// ✅ ENHANCED: Pre-save middleware to hash password with detailed logging
userSchema.pre('save', async function(next) {
  console.log('🔧 User pre-save middleware triggered');
  console.log('🔍 Password modified:', this.isModified('password'));
  console.log('🔍 Is new document:', this.isNew);
  
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    console.log('⏭️ Password not modified, skipping hash');
    return next();
  }
  
  try {
    console.log('🔐 Starting password hash process...');
    console.log('📊 Original password length:', this.password?.length);
    
    // ✅ ENHANCED: Check if bcryptjs is available
    if (!bcrypt) {
      console.error('❌ bcryptjs not available!');
      return next(new Error('bcryptjs dependency not found'));
    }
    
    // Hash password with cost of 12
    console.log('🧂 Generating salt...');
    const salt = await bcrypt.genSalt(12);
    console.log('✅ Salt generated');
    
    console.log('🔒 Hashing password...');
    this.password = await bcrypt.hash(this.password, salt);
    console.log('✅ Password hashed successfully');
    console.log('📊 Hashed password length:', this.password?.length);
    
    next();
  } catch (error) {
    console.error('❌ Password hashing error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
});

// ✅ ENHANCED: Instance method to compare password with logging
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('🔍 Comparing password...');
  console.log('📊 Candidate password length:', candidatePassword?.length);
  console.log('📊 Stored password exists:', !!this.password);
  
  if (!this.password) {
    console.log('❌ No stored password found');
    return false;
  }
  
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('🔍 Password match result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('❌ Password comparison error:', error);
    return false;
  }
};

// Instance method to add pet to favorites
userSchema.methods.addToFavorites = function(petId) {
  if (!this.favorites.includes(petId)) {
    this.favorites.push(petId);
  }
  return this.save();
};

// Instance method to remove pet from favorites
userSchema.methods.removeFromFavorites = function(petId) {
  this.favorites = this.favorites.filter(id => !id.equals(petId));
  return this.save();
};

// Instance method to check if pet is in favorites
userSchema.methods.isFavorite = function(petId) {
  return this.favorites.some(id => id.equals(petId));
};

// Instance method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to get users with role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Static method to get recent users
userSchema.statics.getRecentUsers = function(days = 30) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  
  return this.find({
    createdAt: { $gte: dateThreshold },
    isActive: true
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('User', userSchema);