// Replace the validateObjectId function in your server/routes/products.js

// ============================================
// UTILITY FUNCTIONS - UPDATED FOR CUSTOM IDs
// ============================================

// Flexible ID validation - accepts both ObjectId and custom formats
const validateId = (req, res, next) => {
  const id = req.params.id;
  
  // Allow both MongoDB ObjectIds and custom IDs (like prod_004, product123, etc.)
  const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
  const isValidCustomId = /^[a-zA-Z0-9_-]+$/.test(id) && id.length >= 3;
  
  if (!isValidObjectId && !isValidCustomId) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid product ID format" 
    });
  }
  
  next();
};

// Replace your GET /:id route with this:

// GET /api/products/:id - Get single product by ID (supports both ObjectId and custom IDs)
router.get("/:id", validateId, async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`🛒 GET /products/${productId} - Fetching product details`);
    
    let product = null;
    
    // Try to find by MongoDB ObjectId first
    if (mongoose.Types.ObjectId.isValid(productId)) {
      console.log(`🛒 Searching by ObjectId: ${productId}`);
      product = await Product.findById(productId).lean();
    }
    
    // If not found, try to find by custom ID field
    if (!product) {
      console.log(`🛒 Searching by custom ID field: ${productId}`);
      product = await Product.findOne({ 
        $or: [
          { id: productId },           // Custom id field
          { productId: productId },    // Alternative custom id field
          { customId: productId },     // Another alternative
          { sku: productId },          // Sometimes SKU is used as ID
          { code: productId }          // Product code field
        ]
      }).lean();
    }
    
    if (!product) {
      console.log(`❌ Product not found with ID: ${productId}`);
      
      // Debug: Show available product IDs
      const availableProducts = await Product.find({}, { _id: 1, id: 1, productId: 1, sku: 1, name: 1 }).limit(10).lean();
      console.log('🛒 Available product IDs (first 10):', availableProducts.map(p => ({
        _id: p._id,
        id: p.id,
        productId: p.productId,
        sku: p.sku,
        name: p.name
      })));
      
      return res.status(404).json({
        success: false,
        message: "Product not found",
        searchedId: productId,
        availableIds: availableProducts.map(p => p._id || p.id || p.productId || p.sku).filter(Boolean).slice(0, 5)
      });
    }

    // Add computed fields
    const productWithImage = addImageUrl(product);

    console.log(`✅ Product found: ${productWithImage.displayName} (${productWithImage._id})`);
    
    res.json({
      success: true,
      data: productWithImage
    });

  } catch (error) {
    console.error(`❌ Error fetching product ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product details",
      error: error.message,
      searchedId: req.params.id
    });
  }
});