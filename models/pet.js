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
      values: ['dog', 'cat', 'bird', 'fish', 'rat', 'chinchilla', 'rabbit', 'hamster', 'other'],
      message: 'Invalid pet type'
    },
    lowercase: true
  },
  category: {
    type: String,
    required: [true, 'Pet category is required'],
    enum: {
      values: ['dog', 'cat', 'aquatic', 'other'],
      message: 'Invalid pet category'
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
    enum: ['male', 'female', 'unknown'],
    lowercase: true,
    default: 'unknown'
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra-large'],
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
    required: true,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  personalityTraits: [{
    type: String,
    trim: true,
    maxlength: [30, 'Personality trait cannot exceed 30 characters']
  }],
  healthInfo: {
    vaccinated: { type: Boolean, default: false },
    spayedNeutered: { type: Boolean, default: false },
    specialNeeds: {
      type: String,
      trim: true,
      maxlength: [200, 'Special needs cannot exceed 200 characters']
    },
    lastVetVisit: { type: Date }
  },
  imageUrl: {
    type: String,
    trim: true,
    default: 'https://via.placeholder.com/300x200?text=Pet+Photo'
  },
  imagePublicId: { type: String, trim: true },
  additionalImages: [{
    url: { type: String, trim: true },
    publicId: { type: String, trim: true }
  }],
  status: {
    type: String,
    enum: ['available', 'pending', 'adopted', 'not-available'],
    default: 'available'
  },
  featured: { type: Boolean, default: false },
  adoptionFee: { type: Number, min: 0, default: 0 },
  location: {
    shelter: { type: String, trim: true, maxlength: 100 },
    city: { type: String, trim: true, maxlength: 50 },
    state: { type: String, trim: true, maxlength: 50 }
  },
  contactInfo: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
    },
    phone: { type: String, trim: true, maxlength: 20 }
  },
  views: { type: Number, default: 0 },
  favorites: { type: Number, default: 0 },
  adoptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  adoptedAt: { type: Date, default: null },
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

// Indexes for performance
petSchema.index({ type: 1, status: 1 });
petSchema.index({ category: 1, status: 1 });
petSchema.index({ createdAt: -1 });
petSchema.index({ adoptedAt: -1 });

// Virtuals
petSchema.virtual('ageInWords').get(function () {
  if (this.age === 0) return 'Less than 1 year';
  if (this.age === 1) return '1 year';
  return `${this.age} years`;
});

petSchema.virtual('daysSincePosted').get(function () {
  const now = new Date();
  const diff = Math.abs(now - this.createdAt);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Middleware to auto-set category
petSchema.pre('save', function (next) {
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
      default:
        this.category = 'other';
    }
  }
  next();
});

// Methods
petSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

petSchema.methods.markAsAdopted = function (userId) {
  this.status = 'adopted';
  this.adoptedBy = userId;
  this.adoptedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Pet', petSchema);
