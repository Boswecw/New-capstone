// server/routes/news.js - USING YOUR EXISTING NewsArticle MODEL
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const NewsArticle = require('../models/NewsArticle'); // ✅ Use your existing model
const { protect, admin } = require('../middleware/auth');
const { fetchPetNews, getNewsServiceHealth } = require('../services/newsAPI');

// ✅ Create stable ID for external articles
const createStableExternalId = (article) => {
  const source = article.url || article.title || 'unknown';
  return `ext-${crypto.createHash('md5').update(source).digest('hex').substring(0, 12)}`;
};

// ✅ Format external article to match your NewsArticle schema
const formatExternal = (article) => ({
  id: createStableExternalId(article),
  title: article.title || 'Untitled Article',
  summary: article.description || '',
  content: article.content || article.description || '',
  author: article.author || article.source?.name || 'External Source',
  category: 'external-news',
  imageUrl: article.urlToImage || '',
  originalUrl: article.url,
  published: true,
  featured: false,
  publishedAt: article.publishedAt || new Date(),
  views: 0,
  likes: 0,
  tags: ['external', 'news'],
  source: 'external',
  type: 'external'
});

// ===== MAIN ROUTES =====

// GET /api/news - Get all articles with filtering
router.get('/', async (req, res) => {
  try {
    const { category, source = 'all', search, limit = 50, featured } = req.query;
    let allArticles = [];

    console.log(`📰 GET /news - category: ${category}, source: ${source}, search: ${search}`);

    // ✅ Get custom articles from MongoDB using your NewsArticle model
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
      
      // ✅ Search functionality
      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        customArticles = await NewsArticle.find({
          ...query,
          $or: [
            { title: searchRegex },
            { summary: searchRegex },
            { content: searchRegex },
            { tags: { $in: [searchRegex] } }
          ]
        })
        .sort({ publishedAt: -1 })
        .limit(parseInt(limit))
        .lean();
      } else {
        customArticles = await NewsArticle.find(query)
          .sort({ publishedAt: -1 })
          .limit(parseInt(limit))
          .lean();
      }
      
      allArticles.push(...customArticles);
      console.log(`✅ Found ${customArticles.length} custom articles from MongoDB`);
    }

    // ✅ Include external articles with error handling
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
        custom: allArticles.filter(a => !a.source || a.source !== 'external').length,
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

// GET /api/news/featured - Get featured articles for home page
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    let featuredArticles = [];

    console.log(`📰 GET /news/featured - limit: ${limit}`);

    // ✅ Get featured articles from MongoDB using your model
    const featuredCustom = await NewsArticle.find({ 
      featured: true, 
      published: true 
    })
    .sort({ publishedAt: -1 })
    .limit(parseInt(limit))
    .lean();
    
    featuredArticles.push(...featuredCustom);
    console.log(`✅ Found ${featuredCustom.length} featured articles from MongoDB`);

    // ✅ Fill remaining slots with external articles if needed
    const remainingSlots = Math.max(0, parseInt(limit) - featuredArticles.length);
    if (remainingSlots > 0) {
      try {
        const externalResult = await fetchPetNews('pet adoption OR pet rescue OR pet care', remainingSlots);
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
        custom: featuredArticles.filter(a => !a.source || a.source !== 'external').length,
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
      const searchRegex = new RegExp(search.trim(), 'i');
      articles = await NewsArticle.find({
        ...query,
        $or: [
          { title: searchRegex },
          { summary: searchRegex },
          { content: searchRegex },
          { tags: { $in: [searchRegex] } }
        ]
      })
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit))
      .lean();
    } else {
      articles = await NewsArticle.find(query)
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

// GET /api/news/external - Get only external articles
router.get('/external', async (req, res) => {
  try {
    const { search = 'pets OR dogs OR cats', limit = 20 } = req.query;
    
    const externalResult = await fetchPetNews(search, parseInt(limit));
    
    if (externalResult.success && externalResult.articles) {
      const formattedArticles = externalResult.articles.map(formatExternal);
      
      res.json({
        success: true,
        data: formattedArticles,
        count: formattedArticles.length
      });
    } else {
      res.json({
        success: true,
        data: [],
        count: 0,
        message: 'No external articles available'
      });
    }

  } catch (err) {
    console.error('❌ GET /news/external error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'External news service unavailable',
      data: []
    });
  }
});

// GET /api/news/:id - Get individual article
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📰 GET /news/${id}`);

    // ✅ Try to find article by MongoDB _id first
    let article;
    try {
      article = await NewsArticle.findOne({ 
        _id: id, 
        published: true 
      });
    } catch (err) {
      // ID might not be a valid ObjectId, continue to other checks
    }
    
    if (article) {
      // ✅ Increment view count
      article.views = (article.views || 0) + 1;
      await article.save();
      
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
    
    // ✅ Find and update in MongoDB using your model
    const article = await NewsArticle.findById(id);
    
    if (article) {
      article.likes = (article.likes || 0) + 1;
      await article.save();
      
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

// GET /api/news/health - Health check
router.get('/health', async (req, res) => {
  try {
    const healthData = await getNewsServiceHealth();
    const articleCount = await NewsArticle.countDocuments();
    
    res.json({
      success: true,
      service: 'news',
      status: 'operational',
      timestamp: new Date().toISOString(),
      storage: 'mongodb',
      articles: articleCount,
      ...healthData
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      service: 'news',
      status: 'degraded',
      error: err.message,
      timestamp: new Date().toISOString()
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

    // ✅ Create new article using your NewsArticle model
    const newArticle = new NewsArticle({
      title: title.trim(),
      content: content.trim(),
      summary: summary?.trim() || content.substring(0, 200) + '...',
      category: category || 'news',
      author: req.user?.name || 'FurBabies Team',
      featured: Boolean(featured),
      imageUrl: imageUrl?.trim() || '',
      tags: Array.isArray(tags) ? tags : [],
      published: true,
      publishedAt: new Date()
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
    
    // ✅ Find and update using your NewsArticle model
    const updatedArticle = await NewsArticle.findByIdAndUpdate(
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
    
    // ✅ Find and delete using your NewsArticle model
    const deletedArticle = await NewsArticle.findByIdAndDelete(id);

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
    // ✅ Use MongoDB aggregation with your NewsArticle model
    const stats = await NewsArticle.aggregate([
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

    const categoryStats = await NewsArticle.aggregate([
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

module.exports = router;