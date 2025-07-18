// server/models/Product.js - FIXED to support custom string IDs
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
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
  // ✅ Same fields as Pet model for consistency
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
  },
  // Product-specific fields
  sku: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  ratings: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  inventory: {
    quantity: {
      type: Number,
      default: 1,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  // ✅ KEY FIX: Disable strict mode for _id to allow custom string IDs
  strict: false
});

// ✅ Indexes for better query performance
productSchema.index({ category: 1, inStock: 1 });
productSchema.index({ brand: 1, inStock: 1 });
productSchema.index({ inStock: 1, featured: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });

// ✅ Virtual for price display
productSchema.virtual('priceDisplay').get(function() {
  return typeof this.price === 'number' ? `$${this.price.toFixed(2)}` : 'Price not available';
});

// ✅ Virtual for days since posted
productSchema.virtual('daysSincePosted').get(function() {
  if (!this.createdAt) return 0;
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// ✅ Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (!this.inStock) return 'Out of Stock';
  if (this.inventory?.quantity <= this.inventory?.lowStockThreshold) return 'Low Stock';
  return 'In Stock';
});

// ✅ Virtual for category display
productSchema.virtual('categoryDisplay').get(function() {
  if (!this.category) return 'Uncategorized';
  return this.category.charAt(0).toUpperCase() + this.category.slice(1);
});

// ✅ Pre-save middleware
productSchema.pre('save', function(next) {
  // Auto-generate SKU if not provided
  if (!this.sku && this.isNew) {
    this.sku = `${this.category?.toUpperCase() || 'PROD'}-${Date.now()}`;
  }
  
  // Update inStock based on inventory quantity
  if (this.inventory?.quantity !== undefined) {
    this.inStock = this.inventory.quantity > 0;
  }
  
  next();
});

// ✅ Static methods
productSchema.statics.getInStock = function() {
  return this.find({ inStock: true }).sort({ createdAt: -1 });
};

productSchema.statics.getFeatured = function() {
  return this.find({ inStock: true, featured: true }).sort({ createdAt: -1 });
};

productSchema.statics.getByCategory = function(category) {
  return this.find({ category, inStock: true }).sort({ createdAt: -1 });
};

productSchema.statics.getBestRated = function(limit = 10) {
  return this.find({ inStock: true })
    .sort({ 'ratings.average': -1, 'ratings.count': -1 })
    .limit(limit);
};

// ✅ Instance methods
productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

productSchema.methods.markOutOfStock = function() {
  this.inStock = false;
  if (this.inventory) {
    this.inventory.quantity = 0;
  }
  return this.save();
};

productSchema.methods.markInStock = function(quantity = 1) {
  this.inStock = true;
  if (this.inventory) {
    this.inventory.quantity = quantity;
  }
  return this.save();
};

productSchema.methods.updateRating = function(newRating) {
  const currentAverage = this.ratings?.average || 0;
  const currentCount = this.ratings?.count || 0;
  
  const newCount = currentCount + 1;
  const newAverage = ((currentAverage * currentCount) + newRating) / newCount;
  
  this.ratings = {
    average: Math.round(newAverage * 10) / 10, // Round to 1 decimal
    count: newCount
  };
  
  return this.save();
};

productSchema.methods.adjustInventory = function(quantityChange) {
  if (!this.inventory) {
    this.inventory = { quantity: 0, lowStockThreshold: 5 };
  }
  
  this.inventory.quantity = Math.max(0, this.inventory.quantity + quantityChange);
  this.inStock = this.inventory.quantity > 0;
  
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);