// ==========================================
// FILE 1: server/routes/news.js - HYBRID NEWS SYSTEM
// ==========================================
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { fetchPetNews } = require('../services/newsAPI'); // Your external news service

// ===== MOCK CUSTOM CMS DATA =====
const customNewsData = [
  {
    id: 'custom-1',
    title: 'FurBabies Success Story: Max Finds His Forever Home',
    summary: 'Follow Max the Golden Retriever\'s heartwarming journey from our shelter to a loving family.',
    content: 'When Max arrived at our shelter six months ago, he was timid and uncertain...',
    category: 'success-story',
    author: 'FurBabies Team',
    source: 'internal',
    featured: true,
    published: true,
    publishedAt: new Date('2024-12-10'),
    views: 1567,
    likes: 234,
    readTime: '4 min read',
    imageUrl: 'https://storage.googleapis.com/furbabies-petstore/news/max-success.jpg',
    tags: ['adoption', 'success-story', 'dogs'],
    type: 'custom'
  },
  {
    id: 'custom-2',
    title: 'Holiday Pet Safety Tips from Our Veterinary Team',
    summary: 'Essential safety tips to keep your furry friends safe during the holiday season.',
    content: 'The holidays are wonderful but also present unique challenges for pets...',
    category: 'safety',
    author: 'Dr. Sarah Johnson',
    source: 'internal',
    featured: true,
    published: true,
    publishedAt: new Date('2024-12-15'),
    views: 980,
    likes: 67,
    readTime: '5 min read',
    imageUrl: 'https://storage.googleapis.com/furbabies-petstore/news/holiday-safety.jpg',
    tags: ['safety', 'holidays', 'health'],
    type: 'custom'
  },
  {
    id: 'custom-3',
    title: 'New Adoption Center Opens Downtown',
    summary: 'We\'re excited to announce the opening of our new state-of-the-art adoption facility.',
    content: 'Our new FurBabies Adoption Center officially opened this week...',
    category: 'company-news',
    author: 'FurBabies Team',
    source: 'internal',
    featured: true,
    published: true,
    publishedAt: new Date('2024-12-01'),
    views: 1250,
    likes: 89,
    readTime: '3 min read',
    imageUrl: 'https://storage.googleapis.com/furbabies-petstore/news/adoption-center.jpg',
    tags: ['adoption', 'company', 'facility'],
    type: 'custom'
  }
];

// ===== UTILITY FUNCTIONS =====
const formatExternalArticle = (article, index) => ({
  id: `external-${index}`,
  title: article.title,
  summary: article.description || article.content?.substring(0, 200) + '...',
  content: article.content,
  category: 'external-news',
  author: article.source?.name || 'External Source',
  source: 'external',
  featured: false,
  published: true,
  publishedAt: new Date(article.publishedAt),
  views: Math.floor(Math.random() * 1000) + 100, // Mock view count
  likes: Math.floor(Math.random() * 50) + 5, // Mock like count
  readTime: `${Math.ceil((article.content?.split(' ').length || 300) / 200)} min read`,
  imageUrl: article.urlToImage || 'https://storage.googleapis.com/furbabies-petstore/news/default-external.jpg',
  tags: ['external', 'pet-news'],
  type: 'external',
  originalUrl: article.url
});

// ===== MIXED NEWS ENDPOINTS =====

// GET /api/news/featured - Get featured articles (custom + external)
router.get('/featured', async (req, res) => {
  try {
    console.log('📰 GET /api/news/featured - Fetching mixed content');
    
    const limit = parseInt(req.query.limit) || 6;
    const customFeatured = customNewsData.filter(article => article.featured && article.published);
    
    // Get some external news to supplement
    const externalNewsResult = await fetchPetNews('pets OR dogs OR cats', 3);
    let externalArticles = [];
    
    if (externalNewsResult.success) {
      externalArticles = externalNewsResult.articles
        .slice(0, 3)
        .map(formatExternalArticle);
    }

    // Mix custom and external, prioritize custom
    const mixedArticles = [
      ...customFeatured,
      ...externalArticles
    ]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, limit);

    console.log(`📰 Featured: ${customFeatured.length} custom + ${externalArticles.length} external`);

    res.json({
      success: true,
      data: mixedArticles,
      count: mixedArticles.length,
      breakdown: {
        custom: customFeatured.length,
        external: externalArticles.length
      },
      message: 'Featured news articles retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching featured news:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured news',
      error: error.message
    });
  }
});

// GET /api/news - Get all news with source filtering
router.get('/', async (req, res) => {
  try {
    console.log('📰 GET /api/news - Mixed content with filtering');
    
    const { 
      limit = 20, 
      source = 'all', // 'all', 'custom', 'external'
      category,
      search,
      sort = 'newest'
    } = req.query;

    let allArticles = [];

    // Include custom articles if requested
    if (source === 'all' || source === 'custom') {
      let customArticles = [...customNewsData].filter(article => article.published);
      
      // Filter by category for custom articles
      if (category && category !== 'all') {
        customArticles = customArticles.filter(article => article.category === category);
      }
      
      allArticles.push(...customArticles);
    }

    // Include external articles if requested
    if (source === 'all' || source === 'external') {
      const externalLimit = source === 'external' ? parseInt(limit) : Math.min(10, parseInt(limit));
      const searchQuery = search || 'pets OR dogs OR cats OR animal adoption';
      
      const externalNewsResult = await fetchPetNews(searchQuery, externalLimit);
      
      if (externalNewsResult.success) {
        const externalArticles = externalNewsResult.articles.map(formatExternalArticle);
        allArticles.push(...externalArticles);
      }
    }

    // Apply search filter to custom articles
    if (search && (source === 'all' || source === 'custom')) {
      const searchTerm = search.toLowerCase();
      allArticles = allArticles.filter(article => 
        (article.type === 'external') || // External articles already filtered by API
        (article.title.toLowerCase().includes(searchTerm) ||
         article.summary.toLowerCase().includes(searchTerm) ||
         article.content?.toLowerCase().includes(searchTerm) ||
         article.tags?.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }

    // Sort articles
    if (sort === 'newest') {
      allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    } else if (sort === 'popular') {
      allArticles.sort((a, b) => b.views - a.views);
    } else if (sort === 'liked') {
      allArticles.sort((a, b) => b.likes - a.likes);
    }

    // Apply final limit
    const paginatedArticles = allArticles.slice(0, parseInt(limit));

    console.log(`📰 Mixed news: ${paginatedArticles.length} total articles`);

    res.json({
      success: true,
      data: paginatedArticles,
      count: paginatedArticles.length,
      total: allArticles.length,
      breakdown: {
        custom: paginatedArticles.filter(a => a.type === 'custom').length,
        external: paginatedArticles.filter(a => a.type === 'external').length
      },
      message: 'News articles retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching news articles',
      error: error.message
    });
  }
});

// GET /api/news/external - Get only external news
router.get('/external', async (req, res) => {
  try {
    const { 
      query = 'pets OR dogs OR cats', 
      limit = 10 
    } = req.query;

    console.log(`🌐 Fetching external news: "${query}"`);
    
    const result = await fetchPetNews(query, parseInt(limit));
    
    if (result.success) {
      const formattedArticles = result.articles.map(formatExternalArticle);
      
      res.json({
        success: true,
        data: formattedArticles,
        count: formattedArticles.length,
        totalResults: result.totalResults,
        source: 'NewsAPI.org',
        message: 'External news articles retrieved successfully'
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('❌ Error fetching external news:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching external news',
      error: error.message
    });
  }
});

// GET /api/news/custom - Get only custom CMS content
router.get('/custom', async (req, res) => {
  try {
    const { 
      category,
      featured,
      limit = 10 
    } = req.query;

    let customArticles = [...customNewsData].filter(article => article.published);

    // Filter by category
    if (category && category !== 'all') {
      customArticles = customArticles.filter(article => article.category === category);
    }

    // Filter by featured status
    if (featured === 'true') {
      customArticles = customArticles.filter(article => article.featured);
    }

    // Sort by newest
    customArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Apply limit
    const paginatedArticles = customArticles.slice(0, parseInt(limit));

    console.log(`📝 Custom CMS: ${paginatedArticles.length} articles`);

    res.json({
      success: true,
      data: paginatedArticles,
      count: paginatedArticles.length,
      source: 'Custom CMS',
      message: 'Custom news articles retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching custom news:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching custom news',
      error: error.message
    });
  }
});

// GET /api/news/categories - Get available categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { name: 'all', displayName: 'All Articles', count: 0, type: 'filter' },
      { name: 'success-story', displayName: 'Success Stories', count: 1, type: 'custom' },
      { name: 'safety', displayName: 'Pet Safety', count: 1, type: 'custom' },
      { name: 'company-news', displayName: 'Company News', count: 1, type: 'custom' },
      { name: 'external-news', displayName: 'Pet News', count: 0, type: 'external' }
    ];

    res.json({
      success: true,
      data: categories,
      message: 'News categories retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching news categories',
      error: error.message
    });
  }
});

// GET /api/news/:id - Get specific article
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📰 GET /api/news/${id}`);

    // Check custom articles first
    let article = customNewsData.find(article => article.id === id);

    if (article) {
      if (!article.published) {
        return res.status(403).json({
          success: false,
          message: 'Article is not published'
        });
      }

      // Increment view count
      article.views += 1;

      return res.json({
        success: true,
        data: article,
        source: 'Custom CMS',
        message: 'News article retrieved successfully'
      });
    }

    // If not found in custom, it might be an external article ID
    // For external articles, we'd need to fetch again or implement caching
    res.status(404).json({
      success: false,
      message: 'News article not found'
    });

  } catch (error) {
    console.error('❌ Error fetching news article:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching news article',
      error: error.message
    });
  }
});

// ===== ADMIN ROUTES FOR CUSTOM CMS =====

// POST /api/news/custom - Create custom article (admin only)
router.post('/custom', protect, admin, async (req, res) => {
  try {
    console.log('📝 POST /api/news/custom - Create custom article');
    
    const {
      title,
      summary,
      content,
      category,
      author,
      featured = false,
      published = false,
      tags = [],
      imageUrl
    } = req.body;

    // Basic validation
    if (!title || !summary || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, summary, content, and category are required'
      });
    }

    // Create new custom article
    const newArticle = {
      id: `custom-${customNewsData.length + 1}`,
      title,
      summary,
      content,
      category,
      author: author || req.user.name,
      source: 'internal',
      featured,
      published,
      publishedAt: published ? new Date() : null,
      views: 0,
      likes: 0,
      readTime: `${Math.ceil(content.split(' ').length / 200)} min read`,
      imageUrl: imageUrl || 'https://storage.googleapis.com/furbabies-petstore/news/default.jpg',
      tags: Array.isArray(tags) ? tags : [],
      type: 'custom'
    };

    // Add to mock data (in real app, save to database)
    customNewsData.push(newArticle);

    console.log(`📝 Custom article created: ${newArticle.title}`);

    res.status(201).json({
      success: true,
      data: newArticle,
      message: 'Custom news article created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating custom article:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating custom news article',
      error: error.message
    });
  }
});

module.exports = router;
