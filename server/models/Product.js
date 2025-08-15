// server/models/Product.js - Updated with automatic boolean conversion

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 1000
  },
  price: { 
    type: Number, 
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return !isNaN(v) && v >= 0;
      },
      message: 'Price must be a valid positive number'
    }
  },
  category: { 
    type: String, 
    required: true,
    enum: ['food', 'toys', 'accessories', 'health', 'grooming', 'beds', 'carriers', 'clothing'],
    lowercase: true
  },
  brand: { 
    type: String, 
    trim: true,
    maxlength: 100
  },
  image: { 
    type: String,
    trim: true
  },
  inStock: { 
    type: Boolean, 
    default: true,
    validate: {
      validator: function(v) {
        return typeof v === 'boolean';
      },
      message: 'inStock must be a boolean value'
    }
  },
  featured: { 
    type: Boolean, 
    default: false,
    validate: {
      validator: function(v) {
        return typeof v === 'boolean';
      },
      message: 'featured must be a boolean value'
    }
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    min: 0,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
productSchema.index({ category: 1, inStock: 1, featured: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// Pre-save hook to ensure data types
productSchema.pre('save', function(next) {
  // Ensure booleans are actual booleans
  if (typeof this.featured === 'string') {
    this.featured = this.featured.toLowerCase() === 'true';
  }
  if (typeof this.inStock === 'string') {
    this.inStock = this.inStock.toLowerCase() === 'true';
  }
  
  // Ensure price is a number
  if (typeof this.price === 'string' && !isNaN(this.price)) {
    this.price = parseFloat(this.price);
  }
  
  next();
});

module.exports = mongoose.model('Product', productSchema);