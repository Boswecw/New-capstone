// server/routes/cart.js - MINIMAL CART ROUTE
const express = require('express');
const router = express.Router();

// GET /api/cart - Get cart contents
router.get('/', (req, res) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'sessionId is required' 
      });
    }
    
    console.log('🛒 GET /api/cart - Session:', sessionId);
    
    // Return empty cart for now
    res.json({
      success: true,
      data: { 
        sessionId, 
        items: [], 
        subtotal: 0, 
        currency: 'USD', 
        updatedAt: new Date().toISOString() 
      },
      message: 'Mock cart data - replace with database when available'
    });
    
  } catch (error) {
    console.error('❌ Error in GET /api/cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message
    });
  }
});

// POST /api/cart/add - Add item to cart
router.post('/add', (req, res) => {
  try {
    const { sessionId, itemId, quantity = 1 } = req.body;
    
    console.log('🛒 POST /api/cart/add - Adding item:', { sessionId, itemId, quantity });
    
    res.json({
      success: true,
      message: 'Item added to cart',
      data: {
        sessionId,
        itemId,
        quantity,
        addedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item to cart',
      error: error.message
    });
  }
});

module.exports = router;