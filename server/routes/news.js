// server/routes/news.js - CLEANED UP VERSION (No problematic imports)
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const NewsArticle = require('../models/NewsArticle'); // ✅ Use your existing model
const { protect, admin } = require('../middleware/auth');
const {
  fetchPetNews,
  getFallbackNews,
  getNewsServiceHealth,
} = require('../services/newsAPI');

// ===== HELPER FUNCTIONS =====

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

// GET /api/news/health - Health check
router.get('/health', (req, res) => {
  try {
    const healthStatus = getNewsServiceHealth();
    res.json({
      success: true,
      ...healthStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      message: error.message
    });
  }
});

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

    // ✅ Include external articles if requested
    if (source === 'all' || source === 'external') {
      const searchQuery = search || 'pets OR dogs OR cats OR pet adoption';
      const externalResult = await fetchPetNews(searchQuery, 10);
      
      if (externalResult.success && externalResult.articles) {
        const formattedExternal = externalResult.articles.map(formatExternal);
        allArticles.push(...formattedExternal);
        console.log(`✅ Found ${formattedExternal.length} external articles`);
      }
    }

    // ✅ Sort combined results by date
    allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // ✅ Apply final limit
    if (limit && allArticles.length > parseInt(limit)) {
      allArticles = allArticles.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: allArticles,
      count: allArticles.length,
      breakdown: {
        custom: allArticles.filter(a => a.source !== 'external').length,
        external: allArticles.filter(a => a.source === 'external').length
      }
    });

  } catch (err) {
    console.error('❌ GET /news error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch articles',
      data: []
    });
  }
});

// GET /api/news/featured - Get featured articles (home page)
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    console.log(`🌟 GET /news/featured - limit: ${limit}`);
    
    // ✅ Get featured custom articles first
    const featuredCustom = await NewsArticle.find({ 
      published: true, 
      featured: true 
    })
    .sort({ publishedAt: -1 })
    .limit(parseInt(limit))
    .lean();

    let allFeatured = [...featuredCustom];
    
    // ✅ Fill remaining slots with external news if needed
    const remaining = parseInt(limit) - featuredCustom.length;
    if (remaining > 0) {
      const externalResult = await fetchPetNews('pets trending news', remaining);
      
      if (externalResult.success && externalResult.articles) {
        const formattedExternal = externalResult.articles
          .slice(0, remaining)
          .map(formatExternal);
        allFeatured.push(...formattedExternal);
      }
    }

    // ✅ Sort by date and apply final limit
    allFeatured.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    allFeatured = allFeatured.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: allFeatured,
      count: allFeatured.length,
      breakdown: {
        custom: allFeatured.filter(a => a.source !== 'external').length,
        external: allFeatured.filter(a => a.source === 'external').length,
        externalSource: allFeatured.some(a => a.source === 'external') ? 'live' : 'none'
      }
    });

  } catch (err) {
    console.error('❌ GET /news/featured error:', err);
    
    // ✅ Return fallback data instead of failure
    const fallbackData = getFallbackNews();
    res.json({
      success: true,
      data: fallbackData.articles.map(formatExternal).slice(0, parseInt(req.query.limit || 6)),
      count: Math.min(fallbackData.articles.length, parseInt(req.query.limit || 6)),
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

// GET /api/news/categories - Get available categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await NewsArticle.distinct('category', { published: true });
    
    res.json({
      success: true,
      data: categories
    });

  } catch (err) {
    console.error('❌ GET /news/categories error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch categories',
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
        data: {
          likes: article.likes
        }
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

// ===== ADMIN ROUTES (Protected) =====

// POST /api/news - Create new article (Admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, content, summary, category, featured, imageUrl, tags } = req.body;
    
    const newArticle = new NewsArticle({
      title,
      content,
      summary,
      category: category || 'general',
      featured: featured || false,
      imageUrl: imageUrl || '',
      tags: tags || [],
      author: req.user.name,
      published: true,
      publishedAt: new Date(),
      views: 0,
      likes: 0
    });

    await newArticle.save();
    
    res.status(201).json({
      success: true,
      data: newArticle,
      message: 'Article created successfully'
    });

  } catch (err) {
    console.error('❌ POST /news error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create article' 
    });
  }
});

// PUT /api/news/:id - Update article (Admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const article = await NewsArticle.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    res.json({
      success: true,
      data: article,
      message: 'Article updated successfully'
    });

  } catch (err) {
    console.error(`❌ PUT /news/${req.params.id} error:`, err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update article' 
    });
  }
});

// DELETE /api/news/:id - Delete article (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await NewsArticle.findByIdAndDelete(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    res.json({
      success: true,
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

module.exports = router;