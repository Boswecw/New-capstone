// server/models/Product.js - Updated with automatic boolean conversion
const mongoose = require('mongoose');

// Custom setter to convert string booleans to actual booleans
const booleanSetter = function(val) {
  if (typeof val === 'string') {
    return val.toLowerCase() === 'true' || val === '1';
  }
  return Boolean(val);
};

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
    default: true,
    set: booleanSetter  // Automatically convert string to boolean
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
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
  featured: {
    type: Boolean,
    default: false,
    set: booleanSetter  // Automatically convert string to boolean
  },
  views: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Make optional for existing data
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false  // Allow custom string IDs
});

// Indexes for better query performance
productSchema.index({ category: 1, inStock: 1 });
productSchema.index({ inStock: 1, featured: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });

// Virtual for price display
productSchema.virtual('priceDisplay').get(function() {
  return typeof this.price === 'number' ? `$${this.price.toFixed(2)}` : 'Price not available';
});

// Pre-save middleware to ensure boolean conversion
productSchema.pre('save', function(next) {
  // Ensure featured is boolean
  if (this.featured !== undefined) {
    this.featured = booleanSetter(this.featured);
  }
  
  // Ensure inStock is boolean  
  if (this.inStock !== undefined) {
    this.inStock = booleanSetter(this.inStock);
  }
  
  next();
});

// Static methods
productSchema.statics.getFeatured = function(limit = 4) {
  return this.find({ 
    featured: true, 
    inStock: true 
  }).limit(limit).sort({ createdAt: -1 });
};

productSchema.statics.getInStock = function() {
  return this.find({ inStock: true }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Product', productSchema);