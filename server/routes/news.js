// server/routes/news.js - Complete News CMS API
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Article = require('../models/Article');
const { protect, admin, optionalAuth } = require('../middleware/auth');

// ============================================
// VALIDATION FUNCTIONS
// ============================================

// Validate MongoDB ObjectId format
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid article ID format" 
    });
  }
  next();
};

// Validate article data for creation/update
const validateArticleData = (req, res, next) => {
  const { title, summary, content, category, author } = req.body;
  
  if (!title || !summary || !content || !category || !author) {
    return res.status(400).json({ 
      success: false, 
      message: "Title, summary, content, category, and author are required" 
    });
  }
  
  // Validate category
  const validCategories = ['pets', 'dogs', 'cats', 'veterinary', 'adoption'];
  if (!validCategories.includes(category.toLowerCase())) {
    return res.status(400).json({ 
      success: false, 
      message: `Category must be one of: ${validCategories.join(', ')}` 
    });
  }
  
  next();
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Construct full image URL for articles
const enrichArticleWithImageUrl = (article) => {
  const articleObj = article.toObject ? article.toObject() : article;
  
  return {
    ...articleObj,
    imageUrl: articleObj.image 
      ? `https://storage.googleapis.com/furbabies-petstore/${articleObj.image}` 
      : null,
    hasImage: !!articleObj.image
  };
};

// Calculate read time based on content length
const calculateReadTime = (content) => {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
};

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// @desc Get featured news articles
// @route GET /api/news/featured
// @access Public
router.get('/featured', async (req, res) => {
  try {
    console.log('📰 GET /api/news/featured');
    
    const limit = parseInt(req.query.limit) || 5;
    const skip = parseInt(req.query.skip) || 0;

    const articles = await Article.find({
      published: true,
      featured: true
    })
    .populate('authorId', 'name email')
    .sort({ publishedAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

    const enrichedArticles = articles.map(enrichArticleWithImageUrl);

    console.log(`✅ Found ${enrichedArticles.length} featured articles`);
    
    res.json({
      success: true,
      data: enrichedArticles,
      count: enrichedArticles.length,
      message: 'Featured articles retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching featured news:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured articles',
      error: error.message
    });
  }
});

// @desc Get news categories with article counts
// @route GET /api/news/categories
// @access Public
router.get('/categories', async (req, res) => {
  try {
    console.log('📂 GET /api/news/categories');
    
    const categories = await Article.aggregate([
      { $match: { published: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const categoriesWithNames = categories.map(cat => ({
      name: cat._id,
      displayName: cat._id.charAt(0).toUpperCase() + cat._id.slice(1),
      count: cat.count,
      value: cat._id
    }));

    console.log(`✅ Found ${categoriesWithNames.length} categories`);
    
    res.json({ 
      success: true, 
      data: categoriesWithNames 
    });
  } catch (error) {
    console.error('❌ Error fetching news categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching categories', 
      error: error.message 
    });
  }
});

// @desc Get news by category
// @route GET /api/news/category/:category
// @access Public
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || 'newest';

    console.log(`📰 GET /api/news/category/${category} - Page ${page}`);

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'oldest':
        sortObj = { publishedAt: 1 };
        break;
      case 'popular':
        sortObj = { views: -1, publishedAt: -1 };
        break;
      case 'newest':
      default:
        sortObj = { publishedAt: -1 };
    }

    // Build query
    const query = {
      published: true,
      category: category.toLowerCase()
    };

    const [articles, totalCount] = await Promise.all([
      Article.find(query)
        .populate('authorId', 'name email')
        .sort(sortObj)
        .limit(limit)
        .skip(skip)
        .lean(),
      Article.countDocuments(query)
    ]);

    const enrichedArticles = articles.map(enrichArticleWithImageUrl);

    const totalPages = Math.ceil(totalCount / limit);

    console.log(`✅ Found ${enrichedArticles.length} articles in ${category} category`);
    
    res.json({
      success: true,
      data: enrichedArticles,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching news by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles by category',
      error: error.message
    });
  }
});

// @desc Get all published news with filtering and search
// @route GET /api/news
// @access Public
router.get('/', async (req, res) => {
  try {
    console.log('📰 GET /api/news');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;
    const sort = req.query.sort || 'newest';
    const featured = req.query.featured;

    // Build query
    let query = { published: true };

    if (category) {
      query.category = category.toLowerCase();
    }

    if (featured !== undefined) {
      query.featured = featured === 'true';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'oldest':
        sortObj = { publishedAt: 1 };
        break;
      case 'popular':
        sortObj = { views: -1, publishedAt: -1 };
        break;
      case 'newest':
      default:
        sortObj = { publishedAt: -1 };
    }

    const [articles, totalCount] = await Promise.all([
      Article.find(query)
        .populate('authorId', 'name email')
        .sort(sortObj)
        .limit(limit)
        .skip(skip)
        .lean(),
      Article.countDocuments(query)
    ]);

    const enrichedArticles = articles.map(enrichArticleWithImageUrl);

    const totalPages = Math.ceil(totalCount / limit);

    console.log(`✅ Found ${enrichedArticles.length}/${totalCount} articles`);
    
    res.json({
      success: true,
      data: enrichedArticles,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        category,
        search,
        sort,
        featured
      }
    });
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles',
      error: error.message
    });
  }
});

// @desc Get single article by ID or slug (increment view count)
// @route GET /api/news/:identifier
// @access Public
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    console.log(`📰 GET /api/news/${identifier}`);

    // Check if identifier is ObjectId or slug
    let query;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query = { _id: identifier, published: true };
    } else {
      query = { slug: identifier, published: true };
    }

    const article = await Article.findOneAndUpdate(
      query,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('authorId', 'name email').lean();

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    const enrichedArticle = enrichArticleWithImageUrl(article);

    console.log(`✅ Article found: ${article.title}`);
    
    res.json({
      success: true,
      data: enrichedArticle
    });
  } catch (error) {
    console.error('❌ Error fetching article:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching article',
      error: error.message
    });
  }
});

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// @desc Create new article
// @route POST /api/news
// @access Private (Admin only)
router.post('/', protect, admin, validateArticleData, async (req, res) => {
  try {
    console.log('📝 POST /api/news - Creating new article');
    
    const articleData = {
      ...req.body,
      authorId: req.user._id,
      readTime: calculateReadTime(req.body.content)
    };

    const article = await Article.create(articleData);
    const populatedArticle = await Article.findById(article._id)
      .populate('authorId', 'name email')
      .lean();

    const enrichedArticle = enrichArticleWithImageUrl(populatedArticle);

    console.log(`✅ Article created: ${article.title}`);
    
    res.status(201).json({
      success: true,
      data: enrichedArticle,
      message: 'Article created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating article:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Article with this title already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating article',
      error: error.message
    });
  }
});

// @desc Update article
// @route PUT /api/news/:id
// @access Private (Admin only)
router.put('/:id', protect, admin, validateObjectId, async (req, res) => {
  try {
    console.log(`📝 PUT /api/news/${req.params.id}`);

    // Recalculate read time if content changed
    if (req.body.content) {
      req.body.readTime = calculateReadTime(req.body.content);
    }

    const article = await Article.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('authorId', 'name email').lean();

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    const enrichedArticle = enrichArticleWithImageUrl(article);

    console.log(`✅ Article updated: ${article.title}`);
    
    res.json({
      success: true,
      data: enrichedArticle,
      message: 'Article updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating article:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating article',
      error: error.message
    });
  }
});

// @desc Delete article
// @route DELETE /api/news/:id
// @access Private (Admin only)
router.delete('/:id', protect, admin, validateObjectId, async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/news/${req.params.id}`);

    const article = await Article.findByIdAndDelete(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    console.log(`✅ Article deleted: ${article.title}`);
    
    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting article:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting article',
      error: error.message
    });
  }
});

// @desc Toggle article like
// @route POST /api/news/:id/like
// @access Private
router.post('/:id/like', protect, validateObjectId, async (req, res) => {
  try {
    console.log(`👍 POST /api/news/${req.params.id}/like`);

    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    ).select('likes title').lean();

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    console.log(`✅ Article liked: ${article.title} (${article.likes} likes)`);
    
    res.json({
      success: true,
      data: { likes: article.likes },
      message: 'Article liked successfully'
    });
  } catch (error) {
    console.error('❌ Error liking article:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking article',
      error: error.message
    });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// @desc Get all articles (including unpublished) for admin
// @route GET /api/news/admin/all
// @access Private (Admin only)
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    console.log('👑 GET /api/news/admin/all');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status; // published, draft, all

    let query = {};
    if (status === 'published') {
      query.published = true;
    } else if (status === 'draft') {
      query.published = false;
    }
    // If status is 'all' or undefined, don't filter by published status

    const [articles, totalCount] = await Promise.all([
      Article.find(query)
        .populate('authorId', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Article.countDocuments(query)
    ]);

    const enrichedArticles = articles.map(enrichArticleWithImageUrl);

    const totalPages = Math.ceil(totalCount / limit);

    console.log(`✅ Found ${enrichedArticles.length}/${totalCount} articles for admin`);
    
    res.json({
      success: true,
      data: enrichedArticles,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching admin articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles for admin',
      error: error.message
    });
  }
});

// @desc Get article analytics
// @route GET /api/news/admin/analytics
// @access Private (Admin only)
router.get('/admin/analytics', protect, admin, async (req, res) => {
  try {
    console.log('📊 GET /api/news/admin/analytics');

    const [
      totalArticles,
      publishedArticles,
      featuredArticles,
      topArticles,
      categoryStats
    ] = await Promise.all([
      Article.countDocuments({}),
      Article.countDocuments({ published: true }),
      Article.countDocuments({ published: true, featured: true }),
      Article.find({ published: true })
        .sort({ views: -1 })
        .limit(5)
        .select('title views likes publishedAt')
        .lean(),
      Article.aggregate([
        { $match: { published: true } },
        { $group: { 
          _id: '$category', 
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' }
        }},
        { $sort: { count: -1 } }
      ])
    ]);

    console.log(`✅ Analytics generated: ${totalArticles} total articles`);
    
    res.json({
      success: true,
      data: {
        overview: {
          totalArticles,
          publishedArticles,
          draftArticles: totalArticles - publishedArticles,
          featuredArticles
        },
        topArticles,
        categoryStats,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
});

module.exports = router;