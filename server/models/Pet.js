// server/models/Pet.js - ENHANCED TO HANDLE STRING IDs
const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  // ✅ IMPORTANT: Allow _id to be either ObjectId or String
  _id: {
    type: mongoose.Schema.Types.Mixed, // Allows both ObjectId and String
    required: true
  },
  
  name: {
    type: String,
    required: [true, 'Pet name is required'],
    trim: true,
    maxlength: [100, 'Pet name cannot exceed 100 characters']
  },
  
  type: {
    type: String,
    required: [true, 'Pet type is required'],
    enum: {
      values: ['dog', 'cat', 'fish', 'bird', 'small-pet', 'rabbit', 'hamster'],
      message: 'Pet type must be one of: dog, cat, fish, bird, small-pet, rabbit, hamster'
    }
  },
  
  breed: {
    type: String,
    required: [true, 'Pet breed is required'],
    trim: true,
    maxlength: [100, 'Breed cannot exceed 100 characters']
  },
  
  age: {
    type: mongoose.Schema.Types.Mixed, // Can be number or string like "2 years"
    required: [true, 'Pet age is required']
  },
  
  gender: {
    type: String,
    enum: {
      values: ['male', 'female', 'unknown'],
      message: 'Gender must be male, female, or unknown'
    },
    default: 'unknown'
  },
  
  size: {
    type: String,
    enum: {
      values: ['small', 'medium', 'large', 'extra-large'],
      message: 'Size must be small, medium, large, or extra-large'
    }
  },
  
  color: {
    type: String,
    trim: true,
    maxlength: [50, 'Color cannot exceed 50 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Pet description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  price: {
    type: Number,
    required: [true, 'Pet price is required'],
    min: [0, 'Price cannot be negative'],
    max: [50000, 'Price seems unusually high']
  },
  
  // Image handling
  image: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    trim: true
  },
  
  // Status and availability
  status: {
    type: String,
    enum: {
      values: ['available', 'pending', 'adopted', 'unavailable'],
      message: 'Status must be available, pending, adopted, or unavailable'
    },
    default: 'available'
  },
  
  available: {
    type: Boolean,
    default: true
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  // Location
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  
  // Category (derived from type)
  category: {
    type: String,
    enum: ['dog', 'cat', 'aquatic', 'other'],
    default: 'other'
  },
  
  // Health and care information
  vaccinated: {
    type: Boolean,
    default: false
  },
  
  spayedNeutered: {
    type: Boolean,
    default: false
  },
  
  healthNotes: {
    type: String,
    maxlength: [1000, 'Health notes cannot exceed 1000 characters']
  },
  
  // Social aspects
  votes: {
    up: { type: Number, default: 0 },
    down: { type: Number, default: 0 }
  },
  
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Contact information
  contact: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact name cannot exceed 100 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    }
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  
  favorites: {
    type: Number,
    default: 0
  },
  
  // Adoption tracking
  adoptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  adoptedAt: {
    type: Date,
    default: null
  },
  
  // Admin fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  // ✅ IMPORTANT: Don't let Mongoose auto-generate _id
  _id: false
});

// ✅ IMPORTANT: Create custom _id before saving
petSchema.pre('save', function(next) {
  // If no _id is set, generate one (for new documents)
  if (!this._id) {
    this._id = new mongoose.Types.ObjectId();
  }
  
  // Set category based on type
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
        this.category = 'other';
        break;
      default:
        this.category = 'other';
    }
  }
  
  // Update availability based on status
  if (this.isModified('status')) {
    this.available = this.status === 'available';
  }
  
  next();
});

// Indexes for better query performance
petSchema.index({ type: 1, status: 1 });
petSchema.index({ category: 1, status: 1 });
petSchema.index({ status: 1, featured: 1 });
petSchema.index({ createdAt: -1 });
petSchema.index({ _id: 1 }); // ✅ IMPORTANT: Index on _id for mixed types

// Virtual for age in words
petSchema.virtual('ageInWords').get(function() {
  if (typeof this.age === 'string') return this.age;
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

// Virtual for average rating
petSchema.virtual('averageRating').get(function() {
  if (!this.ratings || this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10; // Round to 1 decimal
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
  this.available = false;
  this.adoptedBy = userId;
  this.adoptedAt = new Date();
  return this.save();
};

// ✅ IMPORTANT: Handle mixed _id types in queries
petSchema.statics.findByAnyId = function(id) {
  return this.findOne({ _id: id });
};

module.exports = mongoose.model('Pet', petSchema);