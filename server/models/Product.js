// server/models/Product.js - FIXED VERSION WITH FEATURED FIELD
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    lowercase: true,
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Product brand is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  inStock: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  image: {
    type: String,
    required: [true, 'Product image is required'],
    trim: true
  },
  // ✅ ADDED: Featured field for homepage display
  featured: {
    type: Boolean,
    default: false
  },
  // Additional useful fields
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  availability: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock'],
    default: 'in-stock'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
productSchema.index({ category: 1, featured: 1 });
productSchema.index({ featured: 1, inStock: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toFixed(2)}`;
});

// Static method to get featured products
productSchema.statics.getFeatured = function() {
  return this.find({ featured: true, inStock: true }).sort({ createdAt: -1 });
};

// Static method to get products by category
productSchema.statics.getByCategory = function(category) {
  return this.find({ category: category, inStock: true }).sort({ name: 1 });
};

module.exports = mongoose.model('Product', productSchema, 'products');