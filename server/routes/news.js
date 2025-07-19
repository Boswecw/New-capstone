// server/routes/news.js - MONGODB VERSION
const express = require('express');
const router = express.Router();
const News = require('../models/News'); // ✅ Import MongoDB model
const { protect, admin } = require('../middleware/auth');
const { fetchPetNews, getNewsServiceHealth } = require('../services/newsAPI');

// ===== MAIN ROUTES =====

// GET /api/news - Get all articles with filtering
router.get('/', async (req, res) => {
  try {
    const { category, source = 'all', search, limit = 50, featured } = req.query;
    let allArticles = [];

    console.log(`📰 GET /news - category: ${category}, source: ${source}, search: ${search}`);

    // ✅ Get custom articles from MongoDB
    if (source === 'all' || source === 'custom') {
      let query = { published: true };
      
      // Add category filter
      if (category && category !== 'all') {
        query.category = category;
      }
      
      // Add featured filter
      if (featured === 'true') {
        query.featured = true;
      }
      
      let customArticles;
      
      // ✅ Use MongoDB text search if search term provided
      if (search && search.trim()) {
        customArticles = await News.searchArticles(search.trim())
          .limit(parseInt(limit))
          .lean(); // .lean() for better performance
      } else {
        customArticles = await News.find(query)
          .sort({ publishedAt: -1 })
          .limit(parseInt(limit))
          .lean();
      }
      
      allArticles.push(...customArticles);
      console.log(`✅ Found ${customArticles.length} custom articles from MongoDB`);
    }

    // ✅ Include external articles (same as before)
    if (source === 'all' || source === 'external') {
      try {
        const searchQuery = search || 'pets OR dogs OR cats OR animal adoption';
        const externalResult = await fetchPetNews(searchQuery, Math.min(limit, 20));
        
        if (externalResult.success && externalResult.articles) {
          const formattedExternal = externalResult.articles.map(formatExternal);
          allArticles.push(...formattedExternal);
          console.log(`✅ Added ${formattedExternal.length} external articles`);
        }
      } catch (externalError) {
        console.error('❌ External news fetch failed:', externalError.message);
      }
    }

    // ✅ Sort all articles by date
    allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    const limitedArticles = allArticles.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: limitedArticles,
      count: limitedArticles.length,
      total: allArticles.length,
      breakdown: {
        custom: allArticles.filter(a => a.source !== 'external').length,
        external: allArticles.filter(a => a.source === 'external').length
      }
    });

  } catch (err) {
    console.error('❌ GET /news error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch news articles',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// GET /api/news/featured - Get featured articles
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    let featuredArticles = [];

    console.log(`📰 GET /news/featured - limit: ${limit}`);

    // ✅ Get featured articles from MongoDB using static method
    const featuredCustom = await News.findFeatured(parseInt(limit))
      .lean();
    
    featuredArticles.push(...featuredCustom);
    console.log(`✅ Found ${featuredCustom.length} featured articles from MongoDB`);

    // ✅ Fill remaining slots with external articles if needed
    const remainingSlots = Math.max(0, parseInt(limit) - featuredArticles.length);
    if (remainingSlots > 0) {
      try {
        const externalResult = await fetchPetNews('pet adoption OR pet rescue', remainingSlots);
        if (externalResult.success && externalResult.articles) {
          const formattedExternal = externalResult.articles.slice(0, remainingSlots).map(formatExternal);
          featuredArticles.push(...formattedExternal);
          console.log(`✅ Added ${formattedExternal.length} external articles to featured`);
        }
      } catch (externalError) {
        console.log('⚠️ External API failed for featured news');
      }
    }

    res.json({
      success: true,
      data: featuredArticles,
      count: featuredArticles.length,
      breakdown: {
        custom: featuredArticles.filter(a => a.source !== 'external').length,
        external: featuredArticles.filter(a => a.source === 'external').length
      }
    });

  } catch (err) {
    console.error('❌ GET /news/featured error:', err);
    
    // ✅ Fallback: return empty array instead of crashing
    res.json({
      success: true,
      data: [],
      count: 0,
      isFallback: true,
      error: 'Failed to load featured articles'
    });
  }
});

// GET /api/news/custom - Get only custom articles
router.get('/custom', async (req, res) => {
  try {
    const { category, search, limit = 50 } = req.query;
    
    let query = { published: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    let articles;
    
    if (search && search.trim()) {
      // ✅ Use MongoDB text search
      articles = await News.searchArticles(search.trim())
        .limit(parseInt(limit))
        .lean();
    } else {
      articles = await News.find(query)
        .sort({ publishedAt: -1 })
        .limit(parseInt(limit))
        .lean();
    }

    res.json({
      success: true,
      data: articles,
      count: articles.length
    });

  } catch (err) {
    console.error('❌ GET /news/custom error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch custom articles' 
    });
  }
});

// GET /api/news/:id - Get individual article
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📰 GET /news/${id}`);

    // ✅ Find article in MongoDB by ID
    const article = await News.findOne({ 
      _id: id, 
      published: true 
    });
    
    if (article) {
      // ✅ Increment view count using instance method
      await article.incrementViews();
      
      return res.json({
        success: true,
        data: article
      });
    }

    // Handle external article IDs
    if (id.startsWith('ext-')) {
      return res.status(404).json({
        success: false,
        message: 'External articles must be viewed at their original source',
        redirect: true
      });
    }

    res.status(404).json({
      success: false,
      message: 'Article not found'
    });

  } catch (err) {
    console.error(`❌ GET /news/${req.params.id} error:`, err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch article' 
    });
  }
});

// POST /api/news/:id/like - Like an article
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ Find and update in MongoDB
    const article = await News.findById(id);
    
    if (article) {
      await article.toggleLike();
      
      res.json({
        success: true,
        data: { likes: article.likes },
        message: 'Article liked successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

  } catch (err) {
    console.error(`❌ POST /news/${req.params.id}/like error:`, err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to like article' 
    });
  }
});

// ===== ADMIN ROUTES (protected) =====

// POST /api/news - Create new article (admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, content, summary, category, featured = false, imageUrl, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // ✅ Create new article using MongoDB model
    const newArticle = new News({
      title: title.trim(),
      content: content.trim(),
      summary: summary?.trim(),
      category: category || 'general',
      author: req.user?.name || 'Admin',
      featured: Boolean(featured),
      imageUrl: imageUrl?.trim(),
      tags: tags || []
    });

    // ✅ Save to MongoDB
    const savedArticle = await newArticle.save();

    res.status(201).json({
      success: true,
      data: savedArticle,
      message: 'Article created successfully'
    });

  } catch (err) {
    console.error('❌ POST /news error:', err);
    
    // ✅ Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create article' 
    });
  }
});

// PUT /api/news/:id - Update article (admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // ✅ Find and update in MongoDB
    const updatedArticle = await News.findByIdAndUpdate(
      id,
      { 
        ...updates, 
        updatedAt: new Date() 
      },
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validation
      }
    );

    if (!updatedArticle) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      data: updatedArticle,
      message: 'Article updated successfully'
    });

  } catch (err) {
    console.error(`❌ PUT /news/${req.params.id} error:`, err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update article' 
    });
  }
});

// DELETE /api/news/:id - Delete article (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ Find and delete from MongoDB
    const deletedArticle = await News.findByIdAndDelete(id);

    if (!deletedArticle) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      data: deletedArticle,
      message: 'Article deleted successfully'
    });

  } catch (err) {
    console.error(`❌ DELETE /news/${req.params.id} error:`, err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete article' 
    });
  }
});

// GET /api/news/stats/analytics - Get article analytics (admin only)
router.get('/stats/analytics', protect, admin, async (req, res) => {
  try {
    // ✅ Use MongoDB aggregation for analytics
    const stats = await News.aggregate([
      {
        $group: {
          _id: null,
          totalArticles: { $sum: 1 },
          publishedArticles: { 
            $sum: { $cond: [{ $eq: ['$published', true] }, 1, 0] } 
          },
          featuredArticles: { 
            $sum: { $cond: [{ $eq: ['$featured', true] }, 1, 0] } 
          },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' },
          avgViews: { $avg: '$views' },
          avgLikes: { $avg: '$likes' }
        }
      }
    ]);

    const categoryStats = await News.aggregate([
      { $match: { published: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {},
        byCategory: categoryStats
      }
    });

  } catch (err) {
    console.error('❌ GET /news/stats/analytics error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// Helper function for external articles (same as before)
const formatExternal = (article) => ({
  id: `ext-${require('crypto').createHash('md5').update(article.url || article.title).digest('hex').substring(0, 12)}`,
  title: article.title || 'Untitled Article',
  summary: article.description || '',
  excerpt: article.description || '',
  content: article.content || article.description || '',
  author: article.author || article.source?.name || 'External Source',
  category: 'external-news',
  source: 'external',
  type: 'external',
  publishedAt: article.publishedAt || new Date(),
  imageUrl: article.urlToImage || '',
  originalUrl: article.url,
  published: true,
  featured: false,
  likes: 0,
  views: 0
});

module.exports = router;