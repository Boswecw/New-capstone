// ==============================================
// server/routes/news.js - FINAL UPDATED MONGO + EXTERNAL + FALLBACK SYSTEM
// ==============================================
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const NewsArticle = require('../models/NewsArticle');
const {
  fetchPetNews,
  testNewsAPIConnection,
  formatExternalArticle
} = require('../services/newsAPI');

// ===== GET /api/news/featured =====
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const featuredCustom = await NewsArticle.find({ published: true, featured: true }).sort({ publishedAt: -1 }).limit(limit);

    const externalResult = await fetchPetNews('pets OR adoption OR animals', 3);
    const externalArticles = (externalResult.success && !externalResult.isFallback)
      ? externalResult.articles.slice(0, 3).map((a, i) => formatExternalArticle(a, i))
      : [];

    const mixed = [...featuredCustom, ...externalArticles]
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);

    res.json({
      success: true,
      data: mixed,
      count: mixed.length
    });
  } catch (err) {
    console.error('❌ Featured news error:', err);
    res.status(500).json({ success: false, message: 'Failed to load featured news', error: err.message });
  }
});

// ===== GET /api/news =====
router.get('/', async (req, res) => {
  try {
    const {
      limit = 50,
      source = 'all',
      category,
      search,
      sort = 'newest'
    } = req.query;

    let articles = [];

    if (source === 'all' || source === 'custom') {
      let customArticles = await NewsArticle.find({ published: true });
      if (category && category !== 'external-news') {
        customArticles = customArticles.filter(a => a.category === category);
      }
      articles.push(...customArticles);
    }

    if (source === 'all' || source === 'external') {
      const externalResult = await fetchPetNews(search || 'pets OR adoption OR animals', 10);
      if (externalResult.success) {
        const externalFormatted = externalResult.articles.map((a, i) => formatExternalArticle(a, i));
        articles.push(...externalFormatted);
      }
    }

    if (search && source !== 'external') {
      const term = search.toLowerCase();
      articles = articles.filter(a =>
        a.title?.toLowerCase().includes(term) ||
        a.summary?.toLowerCase().includes(term) ||
        a.content?.toLowerCase().includes(term) ||
        (Array.isArray(a.tags) && a.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }

    if (sort === 'popular') {
      articles.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sort === 'liked') {
      articles.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }

    const paginated = articles.slice(0, limit);
    res.json({ success: true, data: paginated, count: paginated.length });
  } catch (err) {
    console.error('❌ News index error:', err);
    res.status(500).json({ success: false, message: 'Failed to load news articles', error: err.message });
  }
});

// ===== GET /api/news/:id =====
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const article = await NewsArticle.findById(id);
    if (!article || !article.published) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    res.json({ success: true, data: article });
  } catch (err) {
    console.error('❌ Article fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve article', error: err.message });
  }
});

// ===== POST /api/news/admin/create =====
router.post('/admin/create', protect, admin, async (req, res) => {
  try {
    const article = new NewsArticle(req.body);
    await article.save();
    res.status(201).json({ success: true, message: 'Article created', data: article });
  } catch (err) {
    console.error('❌ Create article error:', err);
    res.status(500).json({ success: false, message: 'Failed to create article', error: err.message });
  }
});

module.exports = router;
