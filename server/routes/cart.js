// File: server/routes/cart.js (CREATE NEW FILE)

const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get cart (for both authenticated and guest users)
router.get('/', async (req, res) => {
  try {
    const { sessionId } = req.query;
    let cartQuery = {};
    
    if (req.user) {
      cartQuery.user = req.user._id;
    } else if (sessionId) {
      cartQuery.sessionId = sessionId;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Session ID required for guest cart'
      });
    }
    
    const cart = await Cart.findOne({
      ...cartQuery,
      status: 'active'
    }).populate('items.product', 'name price image category inStock');
    
    if (!cart) {
      return res.json({
        success: true,
        data: {
          items: [],
          totalAmount: 0,
          totalItems: 0
        }
      });
    }
    
    // Filter out items with out-of-stock products
    const validItems = cart.items.filter(item => 
      item.product && item.product.inStock
    );
    
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }
    
    res.json({
      success: true,
      data: cart
    });
    
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart'
    });
  }
});

// Add item to cart
router.post('/add', [
  body('productId').isMongoId().withMessage('Valid product ID required'),
  body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10'),
  body('sessionId').optional().isString().withMessage('Session ID must be string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { productId, quantity = 1, sessionId } = req.body;
    
    // Check if product exists and is in stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (!product.inStock) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      });
    }
    
    // Find or create cart
    let cartQuery = {};
    if (req.user) {
      cartQuery.user = req.user._id;
    } else if (sessionId) {
      cartQuery.sessionId = sessionId;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Session ID required for guest cart'
      });
    }
    
    let cart = await Cart.findOne({ ...cartQuery, status: 'active' });
    
    if (!cart) {
      cart = new Cart({
        ...cartQuery,
        items: []
      });
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (newQuantity > 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum quantity per item is 10'
        });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity: quantity,
        price: product.price
      });
    }
    
    await cart.save();
    await cart.populate('items.product', 'name price image category inStock');
    
    res.json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
    
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart'
    });
  }
});

// Update item quantity
router.put('/update/:itemIndex', [
  body('quantity').isInt({ min: 0, max: 10 }).withMessage('Quantity must be between 0 and 10'),
  body('sessionId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { itemIndex } = req.params;
    const { quantity, sessionId } = req.body;
    
    let cartQuery = {};
    if (req.user) {
      cartQuery.user = req.user._id;
    } else if (sessionId) {
      cartQuery.sessionId = sessionId;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Session ID required for guest cart'
      });
    }
    
    const cart = await Cart.findOne({ ...cartQuery, status: 'active' });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item index'
      });
    }
    
    if (quantity === 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }
    
    await cart.save();
    await cart.populate('items.product', 'name price image category inStock');
    
    res.json({
      success: true,
      message: quantity === 0 ? 'Item removed from cart' : 'Item quantity updated',
      data: cart
    });
    
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart'
    });
  }
});

// Clear cart
router.delete('/clear', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    let cartQuery = {};
    if (req.user) {
      cartQuery.user = req.user._id;
    } else if (sessionId) {
      cartQuery.sessionId = sessionId;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Session ID required for guest cart'
      });
    }
    
    const cart = await Cart.findOne({ ...cartQuery, status: 'active' });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    
    res.json({
      success: true,
      message: 'Cart cleared',
      data: {
        items: [],
        totalAmount: 0,
        totalItems: 0
      }
    });
    
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
});

module.exports = router;