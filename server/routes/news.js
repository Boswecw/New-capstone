// server/routes/news.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');

// ❌ REMOVE THIS LINE: const newsAPI = require('../services/newsAPI');

// Mock news data
const mockNewsData = [
  {
    id: '1',
    title: 'New Pet Adoption Center Opens Downtown',
    summary: 'A state-of-the-art pet adoption facility has opened its doors.',
    category: 'adoption',
    author: 'FurBabies Team',
    featured: true,
    published: true,
    publishedAt: new Date('2024-12-01'),
    views: 1250,
    likes: 89
  },
  {
    id: '2', 
    title: 'Holiday Pet Safety Tips',
    summary: 'Keep your furry friends safe during the holiday season.',
    category: 'safety',
    author: 'Dr. Sarah Johnson',
    featured: true,
    published: true,
    publishedAt: new Date('2024-12-15'),
    views: 980,
    likes: 67
  },
  {
    id: '3',
    title: 'Success Story: Max Finds His Forever Home',
    summary: 'Follow Max the Golden Retriever\'s journey from shelter to family.',
    category: 'success-story',
    author: 'Maria Rodriguez',
    featured: true,
    published: true,
    publishedAt: new Date('2024-12-10'),
    views: 1567,
    likes: 234
  }
];

// GET /api/news/featured - Get featured news articles  
router.get('/featured', async (req, res) => {
  try {
    console.log('📰 GET /api/news/featured');
    
    const limit = parseInt(req.query.limit) || 3;
    
    const featuredNews = mockNewsData
      .filter(article => article.featured && article.published)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);

    console.log(`📰 Found ${featuredNews.length} featured articles`);

    res.json({
      success: true,
      data: featuredNews,
      count: featuredNews.length,
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

// GET /api/news - Get all news articles
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockNewsData,
      message: 'News articles retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching news articles',
      error: error.message
    });
  }
});

// GET /api/news/categories - Get news categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { name: 'adoption', displayName: 'Adoption', count: 1 },
      { name: 'safety', displayName: 'Safety', count: 1 },
      { name: 'success-story', displayName: 'Success Stories', count: 1 }
    ];
    
    res.json({
      success: true,
      data: categories,
      message: 'News categories retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching news categories',
      error: error.message
    });
  }
});

// GET /api/news/category/:category - Get news by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const categoryNews = mockNewsData
      .filter(article => article.category === category && article.published)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);

    res.json({
      success: true,
      data: categoryNews,
      count: categoryNews.length,
      message: `News articles in category '${category}' retrieved successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching news by category',
      error: error.message
    });
  }
});

module.exports = router;