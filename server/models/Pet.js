// server/models/Pet.js - Complete corrected section
// Replace your current Pet model with this corrected version:

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
    type: Number,
    required: [true, 'Pet age is required'],
    min: [0, 'Age cannot be negative'],
    max: [30, 'Age cannot exceed 30 years']
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
  imageUrl: {
    type: String,
    trim: true,
    default: 'https://via.placeholder.com/300x200?text=Pet+Photo'
  },
  imagePublicId: {
    type: String,
    trim: true
  },
  additionalImages: [{
    url: {
      type: String,
      trim: true
    },
    publicId: {
      type: String,
      trim: true
    }
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
    min: [0, 'Adoption fee cannot be negative'],
    default: 0
  },
  location: {
    shelter: {
      type: String,
      trim: true,
      maxlength: [100, 'Shelter name cannot exceed 100 characters']
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
  toObject: { virtuals: true }
});

// Indexes for better query performance
petSchema.index({ type: 1, status: 1 });
petSchema.index({ category: 1, status: 1 });
petSchema.index({ status: 1, featured: 1 });
petSchema.index({ createdAt: -1 });
petSchema.index({ adoptedAt: -1 });

// Virtual for age in words
petSchema.virtual('ageInWords').get(function() {
  if (this.age === 0) return 'Less than 1 year';
  if (this.age === 1) return '1 year';
  return `${this.age} years`;
});

// Virtual for days since posted
petSchema.virtual('daysSincePosted').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Pre-save middleware to set category based on type
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
      case 'small-pet':  // ✅ Handle small-pet type
      case 'bird':
      case 'rabbit':
      case 'hamster':
        this.category = 'other';
        break;
      default:
        this.category = 'other';
    }
  }
  next();
});

// Static method to get available pets
petSchema.statics.getAvailable = function() {
  return this.find({ status: 'available' }).sort({ createdAt: -1 });
};

// Static method to get featured pets
petSchema.statics.getFeatured = function() {
  return this.find({ status: 'available', featured: true }).sort({ createdAt: -1 });
};

// Method to increment views
petSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to mark as adopted
petSchema.methods.markAsAdopted = function(userId) {
  this.status = 'adopted';
  this.adoptedBy = userId;
  this.adoptedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Pet', petSchema);