// server/routes/news.js
const express = require('express');
const router = express.Router();

// Mock news data - replace with actual database calls
const newsData = {
  categories: ['pets', 'dogs', 'cats', 'veterinary', 'adoption'],
  articles: {
    pets: [
      {
        id: 1,
        title: "Top 10 Pet Care Tips for New Owners",
        summary: "Essential guidance for first-time pet parents",
        category: "pets",
        publishedAt: new Date().toISOString()
      },
      {
        id: 2,
        title: "Creating a Pet-Friendly Home Environment",
        summary: "How to make your home safe and welcoming for pets",
        category: "pets",
        publishedAt: new Date().toISOString()
      }
    ],
    dogs: [
      {
        id: 3,
        title: "Dog Training Basics: Building a Strong Bond",
        summary: "Fundamental training techniques for dogs of all ages",
        category: "dogs",
        publishedAt: new Date().toISOString()
      }
    ],
    cats: [
      {
        id: 4,
        title: "Understanding Your Cat's Behavior",
        summary: "Decode your feline's mysterious ways",
        category: "cats",
        publishedAt: new Date().toISOString()
      }
    ],
    veterinary: [
      {
        id: 5,
        title: "Annual Vet Checkups: What to Expect",
        summary: "A complete guide to keeping your pet healthy",
        category: "veterinary",
        publishedAt: new Date().toISOString()
      },
      {
        id: 6,
        title: "Emergency Pet Care: When to Rush to the Vet",
        summary: "Critical signs that require immediate attention",
        category: "veterinary",
        publishedAt: new Date().toISOString()
      }
    ],
    adoption: [
      {
        id: 7,
        title: "Preparing for Pet Adoption: A Complete Checklist",
        summary: "Everything you need before bringing your new pet home",
        category: "adoption",
        publishedAt: new Date().toISOString()
      },
      {
        id: 8,
        title: "The First 30 Days: Helping Your Adopted Pet Adjust",
        summary: "Creating a smooth transition for your new family member",
        category: "adoption",
        publishedAt: new Date().toISOString()
      }
    ]
  }
};

// GET /api/news/categories - Get all news categories
router.get('/categories', async (req, res) => {
  try {
    console.log('📂 Fetching news categories...');
    
    res.json({
      success: true,
      data: newsData.categories,
      message: 'News categories retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching news categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching news categories',
      error: error.message
    });
  }
});

// GET /api/news - Get all news articles or filter by category
router.get('/', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    
    let articles = [];
    
    if (category && newsData.articles[category]) {
      console.log(`📰 Fetching news for category: ${category}`);
      articles = newsData.articles[category];
    } else {
      // Return all articles if no specific category
      console.log('📰 Fetching all news articles');
      articles = Object.values(newsData.articles).flat();
    }
    
    // Apply limit
    const limitedArticles = articles.slice(0, parseInt(limit));
    
    console.log(`✅ Articles loaded: ${limitedArticles.length}`);
    
    res.json({
      success: true,
      data: limitedArticles,
      total: articles.length,
      category: category || 'all',
      message: 'News articles retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching news articles:', error);
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
    const articleId = parseInt(req.params.id);
    
    // Find article across all categories
    let foundArticle = null;
    for (const category in newsData.articles) {
      foundArticle = newsData.articles[category].find(article => article.id === articleId);
      if (foundArticle) break;
    }
    
    if (!foundArticle) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.json({
      success: true,
      data: foundArticle,
      message: 'News article retrieved successfully'
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

module.exports = router;