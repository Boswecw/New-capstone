// server/routes/news.js - COMPLETE NEWS ROUTES
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');

// Mock news data (you can replace this with a MongoDB model later)
const mockNewsData = [
  {
    id: '1',
    title: 'New Pet Adoption Center Opens Downtown',
    summary: 'A state-of-the-art pet adoption facility has opened its doors.',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    category: 'adoption',
    author: 'FurBabies Team',
    featured: true,
    published: true,
    publishedAt: new Date('2024-12-01'),
    views: 1250,
    likes: 89,
    imageUrl: '/images/news/adoption-center.jpg',
    tags: ['adoption', 'facility', 'downtown']
  },
  {
    id: '2', 
    title: 'Holiday Pet Safety Tips',
    summary: 'Keep your furry friends safe during the holiday season.',
    content: 'The holidays can be a dangerous time for pets...',
    category: 'safety',
    author: 'Dr. Sarah Johnson',
    featured: true,
    published: true,
    publishedAt: new Date('2024-12-15'),
    views: 980,
    likes: 67,
    imageUrl: '/images/news/holiday-safety.jpg',
    tags: ['safety', 'holidays', 'tips']
  },
  {
    id: '3',
    title: 'Success Story: Max Finds His Forever Home',
    summary: 'Follow Max the Golden Retriever\'s journey from shelter to family.',
    content: 'Max arrived at our shelter six months ago...',
    category: 'success-story',
    author: 'Maria Rodriguez',
    featured: true,
    published: true,
    publishedAt: new Date('2024-12-10'),
    views: 1567,
    likes: 234,
    imageUrl: '/images/news/max-success.jpg',
    tags: ['success-story', 'golden-retriever', 'adoption']
  },
  {
    id: '4',
    title: 'Volunteer Training Workshop This Weekend',
    summary: 'Join us for comprehensive volunteer training.',
    content: 'We are hosting a volunteer training workshop...',
    category: 'events',
    author: 'FurBabies Team',
    featured: false,
    published: true,
    publishedAt: new Date('2024-12-20'),
    views: 456,
    likes: 23,
    imageUrl: '/images/news/volunteer-training.jpg',
    tags: ['volunteer', 'training', 'workshop']
  },
  {
    id: '5',
    title: 'Understanding Pet Nutrition',
    summary: 'Learn about proper nutrition for your pets.',
    content: 'Proper nutrition is essential for your pet\'s health...',
    category: 'health',
    author: 'Dr. Mike Chen',
    featured: false,
    published: true,
    publishedAt: new Date('2024-12-18'),
    views: 789,
    likes: 45,
    imageUrl: '/images/news/pet-nutrition.jpg',
    tags: ['nutrition', 'health', 'diet']
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

// GET /api/news/categories - Get distinct categories
router.get('/categories', async (req, res) => {
  try {
    console.log('📰 GET /api/news/categories');
    
    const categories = [...new Set(mockNewsData.map(article => article.category))];
    
    res.json({
      success: true,
      data: categories,
      message: 'News categories retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// GET /api/news - Get all news articles
router.get('/', async (req, res) => {
  try {
    console.log('📰 GET /api/news - Query params:', req.query);
    
    const { 
      category, 
      featured, 
      search, 
      limit = 10, 
      page = 1, 
      sort = 'publishedAt' 
    } = req.query;
    
    let filteredNews = [...mockNewsData];
    
    // Filter by published status
    filteredNews = filteredNews.filter(article => article.published);
    
    // Filter by category
    if (category && category !== 'all') {
      filteredNews = filteredNews.filter(article => article.category === category);
    }
    
    // Filter by featured status
    if (featured === 'true') {
      filteredNews = filteredNews.filter(article => article.featured);
    }
    
    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase();
      filteredNews = filteredNews.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.summary.toLowerCase().includes(searchLower) ||
        article.content.toLowerCase().includes(searchLower) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort articles
    filteredNews.sort((a, b) => {
      switch (sort) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'views':
          return b.views - a.views;
        case 'likes':
          return b.likes - a.likes;
        case 'oldest':
          return new Date(a.publishedAt) - new Date(b.publishedAt);
        default: // publishedAt (newest first)
          return new Date(b.publishedAt) - new Date(a.publishedAt);
      }
    });
    
    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedNews = filteredNews.slice(startIndex, endIndex);
    
    const totalPages = Math.ceil(filteredNews.length / parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedNews,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalArticles: filteredNews.length,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
        limit: parseInt(limit)
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

// GET /api/news/:id - Get specific news article
router.get('/:id', async (req, res) => {
  try {
    console.log('📰 GET /api/news/:id - Fetching article:', req.params.id);
    
    const { id } = req.params;
    const article = mockNewsData.find(article => article.id === id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    // Increment view count (in a real app, you'd update the database)
    article.views += 1;
    
    res.json({
      success: true,
      data: article,
      message: 'Article retrieved successfully'
    });
    
  } catch (error) {
    console.error(`❌ GET /news/${req.params.id} error:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch article',
      error: error.message 
    });
  }
});

// POST /api/news/:id/like - Like an article
router.post('/:id/like', async (req, res) => {
  try {
    console.log('📰 POST /api/news/:id/like - Liking article:', req.params.id);
    
    const { id } = req.params;
    const article = mockNewsData.find(article => article.id === id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    // Increment likes (in a real app, you'd update the database)
    article.likes += 1;
    
    res.json({
      success: true,
      data: {
        likes: article.likes
      },
      message: 'Article liked successfully'
    });
    
  } catch (error) {
    console.error(`❌ POST /news/${req.params.id}/like error:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to like article',
      error: error.message 
    });
  }
});

// ===== ADMIN ROUTES (Protected) =====

// POST /api/news - Create new article (Admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    console.log('📰 POST /api/news - Admin creating article');
    
    const { 
      title, 
      content, 
      summary, 
      category, 
      featured, 
      imageUrl, 
      tags 
    } = req.body;
    
    if (!title || !content || !summary) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and summary are required'
      });
    }
    
    const newArticle = {
      id: String(mockNewsData.length + 1),
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
    };
    
    mockNewsData.push(newArticle);
    
    res.status(201).json({
      success: true,
      data: newArticle,
      message: 'Article created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error creating article:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating article',
      error: error.message
    });
  }
});

// PUT /api/news/:id - Update article (Admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    console.log('📰 PUT /api/news/:id - Admin updating article:', req.params.id);
    
    const { id } = req.params;
    const articleIndex = mockNewsData.findIndex(article => article.id === id);
    
    if (articleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    // Update article with new data
    const updatedArticle = {
      ...mockNewsData[articleIndex],
      ...req.body,
      id, // Preserve the ID
      updatedAt: new Date()
    };
    
    mockNewsData[articleIndex] = updatedArticle;
    
    res.json({
      success: true,
      data: updatedArticle,
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

// DELETE /api/news/:id - Delete article (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    console.log('📰 DELETE /api/news/:id - Admin deleting article:', req.params.id);
    
    const { id } = req.params;
    const articleIndex = mockNewsData.findIndex(article => article.id === id);
    
    if (articleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    const deletedArticle = mockNewsData.splice(articleIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedArticle,
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

// GET /api/news/custom - Get custom news for admin dashboard
router.get('/custom', protect, admin, async (req, res) => {
  try {
    console.log('📰 GET /api/news/custom - Admin fetching custom news');
    
    const customNews = mockNewsData.map(article => ({
      id: article.id,
      title: article.title,
      category: article.category,
      author: article.author,
      published: article.published,
      featured: article.featured,
      views: article.views,
      likes: article.likes,
      publishedAt: article.publishedAt
    }));
    
    res.json({
      success: true,
      data: customNews,
      message: 'Custom news data retrieved successfully'
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

module.exports = router;