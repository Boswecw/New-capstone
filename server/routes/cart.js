// server/routes/cart.js
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart'); // You may need to create this model
const Product = require('../models/Product');
const { enrichEntityWithImages } = require('../utils/imageUtils');

/**
 * Cart Model Schema (add to models/Cart.js if not exists)
 * {
 *   sessionId: String (for guests),
 *   userId: ObjectId (for authenticated users),
 *   items: [{
 *     productId: ObjectId,
 *     quantity: Number,
 *     price: Number,
 *     addedAt: Date
 *   }],
 *   updatedAt: Date
 * }
 */

/**
 * GET /api/cart
 * Get cart by sessionId (guest) or userId (authenticated)
 */
router.get('/', async (req, res) => {
  try {
    const { sessionId } = req.query;
    const userId = req.user?.id; // From auth middleware if authenticated

    if (!sessionId && !userId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID or authentication required'
      });
    }

    // Find cart by sessionId or userId
    const query = userId ? { userId } : { sessionId };
    let cart = await Cart.findOne(query).lean();

    // If no cart exists, return empty cart
    if (!cart) {
      return res.json({
        success: true,
        data: {
          items: [],
          total: 0,
          count: 0
        }
      });
    }

    // Populate product details
    const productIds = cart.items.map(item => item.productId);
    const products = await Product.find({ 
      _id: { $in: productIds } 
    }).lean();

    // Map products by ID for quick lookup
    const productMap = {};
    products.forEach(product => {
      productMap[product._id.toString()] = enrichEntityWithImages(product, 'product');
    });

    // Enrich cart items with product details
    const enrichedItems = cart.items
      .map(item => {
        const product = productMap[item.productId.toString()];
        if (!product) return null; // Product no longer exists
        
        return {
          id: item._id,
          product,
          quantity: item.quantity,
          price: item.price || product.price,
          subtotal: (item.price || product.price) * item.quantity,
          addedAt: item.addedAt
        };
      })
      .filter(Boolean); // Remove null items

    // Calculate totals
    const total = enrichedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const count = enrichedItems.reduce((sum, item) => sum + item.quantity, 0);

    console.log(`✅ Returning cart with ${enrichedItems.length} items`);

    res.json({
      success: true,
      data: {
        id: cart._id,
        items: enrichedItems,
        total: Math.round(total * 100) / 100,
        count,
        updatedAt: cart.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message
    });
  }
});

/**
 * POST /api/cart/items
 * Add item to cart
 */
router.post('/items', async (req, res) => {
  try {
    const { productId, quantity = 1, sessionId } = req.body;
    const userId = req.user?.id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID required'
      });
    }

    if (!sessionId && !userId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID or authentication required'
      });
    }

    // Verify product exists and is in stock
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
    const query = userId ? { userId } : { sessionId };
    let cart = await Cart.findOne(query);

    if (!cart) {
      cart = new Cart({
        ...query,
        items: [],
        updatedAt: new Date()
      });
    }

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity,
        price: product.price,
        addedAt: new Date()
      });
    }

    cart.updatedAt = new Date();
    await cart.save();

    console.log(`✅ Added ${quantity}x ${product.name} to cart`);

    res.json({
      success: true,
      message: 'Item added to cart',
      data: {
        cartId: cart._id,
        itemCount: cart.items.length,
        totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0)
      }
    });

  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to cart',
      error: error.message
    });
  }
});

/**
 * PUT /api/cart/items/:itemId
 * Update cart item quantity
 */
router.put('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity, sessionId } = req.body;
    const userId = req.user?.id;

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity'
      });
    }

    const query = userId ? { userId } : { sessionId };
    const cart = await Cart.findOne(query);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    if (quantity === 0) {
      // Remove item
      cart.items.pull(itemId);
    } else {
      // Update quantity
      item.quantity = quantity;
    }

    cart.updatedAt = new Date();
    await cart.save();

    res.json({
      success: true,
      message: quantity === 0 ? 'Item removed from cart' : 'Cart updated',
      data: {
        cartId: cart._id,
        itemCount: cart.items.length
      }
    });

  } catch (error) {
    console.error('❌ Error updating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart',
      error: error.message
    });
  }
});

/**
 * DELETE /api/cart/items/:itemId
 * Remove item from cart
 */
router.delete('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { sessionId } = req.query;
    const userId = req.user?.id;

    const query = userId ? { userId } : { sessionId };
    const cart = await Cart.findOne(query);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items.pull(itemId);
    cart.updatedAt = new Date();
    await cart.save();

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: {
        cartId: cart._id,
        itemCount: cart.items.length
      }
    });

  } catch (error) {
    console.error('❌ Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from cart',
      error: error.message
    });
  }
});

/**
 * DELETE /api/cart
 * Clear entire cart
 */
router.delete('/', async (req, res) => {
  try {
    const { sessionId } = req.query;
    const userId = req.user?.id;

    const query = userId ? { userId } : { sessionId };
    const result = await Cart.findOneAndDelete(query);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    res.json({
      success: true,
      message: 'Cart cleared'
    });

  } catch (error) {
    console.error('❌ Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
});

module.exports = router;