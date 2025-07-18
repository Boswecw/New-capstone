// server/models/Pet.js - SIMPLE FIX to allow custom string IDs
const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Pet name is required'],
    trim: true,
    maxlength: [50, 'Pet name cannot exceed 50 characters']
  },
  type: {
    type: String,
    required: [true, 'Pet type is required'],
    enum: {
      values: ['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'small-pet', 'other'],
      message: 'Pet type must be one of: dog, cat, bird, fish, rabbit, hamster, small-pet, other'
    },
    lowercase: true
  },
  category: {
    type: String,
    required: [true, 'Pet category is required'],
    enum: {
      values: ['dog', 'cat', 'aquatic', 'other'],
      message: 'Pet category must be one of: dog, cat, aquatic, other'
    },
    lowercase: true
  },
  breed: {
    type: String,
    required: [true, 'Pet breed is required'],
    trim: true,
    maxlength: [50, 'Breed cannot exceed 50 characters']
  },
  age: {
    type: String, // ✅ Changed to String to match your data ("6 months")
    required: [true, 'Pet age is required'],
    trim: true
  },
  gender: {
    type: String,
    enum: {
      values: ['male', 'female', 'unknown'],
      message: 'Gender must be male, female, or unknown'
    },
    lowercase: true,
    default: 'unknown'
  },
  size: {
    type: String,
    enum: {
      values: ['small', 'medium', 'large', 'extra-large'],
      message: 'Size must be small, medium, large, or extra-large'
    },
    lowercase: true,
    default: 'medium'
  },
  color: {
    type: String,
    trim: true,
    maxlength: [30, 'Color cannot exceed 30 characters']
  },
  description: {
    type: String,
    required: [true, 'Pet description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  personalityTraits: [{
    type: String,
    trim: true,
    maxlength: [30, 'Personality trait cannot exceed 30 characters']
  }],
  healthInfo: {
    vaccinated: {
      type: Boolean,
      default: false
    },
    spayedNeutered: {
      type: Boolean,
      default: false
    },
    specialNeeds: {
      type: String,
      trim: true,
      maxlength: [200, 'Special needs cannot exceed 200 characters']
    },
    lastVetVisit: {
      type: Date
    }
  },
  // ✅ Using 'image' to match your database structure
  image: {
    type: String,
    trim: true,
    default: null
  },
  imageUrl: {
    type: String,
    trim: true,
    default: null
  },
  imagePublicId: { 
    type: String, 
    trim: true 
  },
  additionalImages: [{
    url: { type: String, trim: true },
    publicId: { type: String, trim: true }
  }],
  status: {
    type: String,
    enum: {
      values: ['available', 'pending', 'adopted', 'not-available'],
      message: 'Status must be available, pending, adopted, or not-available'
    },
    default: 'available'
  },
  featured: { 
    type: Boolean, 
    default: false 
  },
  adoptionFee: { 
    type: Number, 
    min: 0, 
    default: 0 
  },
  location: {
    shelter: { 
      type: String, 
      trim: true, 
      maxlength: 100 
    },
    city: { 
      type: String, 
      trim: true, 
      maxlength: 50 
    },
    state: { 
      type: String, 
      trim: true, 
      maxlength: 50 
    }
  },
  contactInfo: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    }
  },
  views: {
    type: Number,
    default: 0
  },
  favorites: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  adoptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  adoptedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  // ✅ KEY FIX: Disable strict mode for _id to allow custom string IDs
  strict: false
});

// ✅ Indexes for better query performance
petSchema.index({ type: 1, status: 1 });
petSchema.index({ category: 1, status: 1 });
petSchema.index({ status: 1, featured: 1 });
petSchema.index({ createdAt: -1 });
petSchema.index({ adoptedAt: -1 });

// Virtual for age in words (handles string ages like "6 months")
petSchema.virtual('ageInWords').get(function() {
  if (!this.age) return 'Age unknown';
  return this.age; // Return as-is since it's already descriptive
});

// Virtual for days since posted
petSchema.virtual('daysSincePosted').get(function() {
  if (!this.createdAt) return 0;
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Pre-save middleware to handle category assignment
petSchema.pre('save', function(next) {
  if (this.isModified('type')) {
    switch (this.type) {
      case 'dog':
        this.category = 'dog';
        break;
      case 'cat':
        this.category = 'cat';
        break;
      case 'fish':
        this.category = 'aquatic';
        break;
      case 'small-pet':
      case 'bird':
      case 'rabbit':
      case 'hamster':
      case 'other':
        this.category = 'other';
        break;
      default:
        this.category = 'other';
    }
  }
  next();
});

// Static methods
petSchema.statics.getAvailable = function() {
  return this.find({ status: 'available' }).sort({ createdAt: -1 });
};

petSchema.statics.getFeatured = function() {
  return this.find({ status: 'available', featured: true }).sort({ createdAt: -1 });
};

// Instance methods
petSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

petSchema.methods.markAsAdopted = function(userId) {
  this.status = 'adopted';
  this.adoptedBy = userId;
  this.adoptedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Pet', petSchema);