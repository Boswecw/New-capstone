// server/models/Product.js - FIXED TO MATCH PET MODEL PATTERN

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // ❌ REMOVE: Don't define _id at all - let MongoDB handle it like pets do!
  // _id: {
  //   type: String,
  //   required: true
  // },
  
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['food', 'toys', 'accessories', 'health', 'grooming', 'bedding', 'other'],
      message: 'Invalid category'
    },
    lowercase: true,
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [50, 'Brand cannot exceed 50 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  inStock: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    trim: true,
    default: 'placeholder-product.jpg'
  },
  // ✅ ADD: Same fields as Pet model for consistency
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true, // Same as Pet model
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ ADD: Same indexes pattern as Pet model
productSchema.index({ category: 1, inStock: 1 });
productSchema.index({ brand: 1, inStock: 1 });
productSchema.index({ inStock: 1, featured: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });

// ✅ ADD: Virtual for price display (like pets have ageInWords)
productSchema.virtual('priceDisplay').get(function() {
  return `$${this.price.toFixed(2)}`;
});

// ✅ ADD: Virtual for days since posted (same as pets)
productSchema.virtual('daysSincePosted').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// ✅ ADD: Static methods like pets have
productSchema.statics.getInStock = function() {
  return this.find({ inStock: true }).sort({ createdAt: -1 });
};

productSchema.statics.getFeatured = function() {
  return this.find({ inStock: true, featured: true }).sort({ createdAt: -1 });
};

// ✅ ADD: Instance methods like pets have
productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

productSchema.methods.markOutOfStock = function() {
  this.inStock = false;
  return this.save();
};

productSchema.methods.markInStock = function() {
  this.inStock = true;
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);