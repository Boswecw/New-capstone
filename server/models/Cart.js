// server/models/Cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    sparse: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    index: true
  },
  items: [cartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30*24*60*60*1000), // 30 days
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true
});

// Ensure either sessionId or userId is present
cartSchema.pre('validate', function(next) {
  if (!this.sessionId && !this.userId) {
    next(new Error('Either sessionId or userId is required'));
  } else {
    next();
  }
});

// Update the updatedAt timestamp on save
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to calculate total
cartSchema.methods.calculateTotal = function() {
  return this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

// Instance method to get item count
cartSchema.methods.getItemCount = function() {
  return this.items.reduce((count, item) => {
    return count + item.quantity;
  }, 0);
};

// Static method to clean up expired carts
cartSchema.statics.cleanupExpired = async function() {
  const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000);
  return await this.deleteMany({
    updatedAt: { $lt: thirtyDaysAgo },
    userId: { $exists: false }
  });
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;