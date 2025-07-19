// server/routes/news.js - FINAL VERSION FOR HYBRID NEWS
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { fetchPetNews, testNewsAPIConnection } = require('../services/newsAPI');

// 📰 In-memory custom CMS articles (can be moved to DB)
let customArticles = require('../data/customArticles.json'); // Replace this with DB logic if needed

// Format external article into internal schema
const formatExternal = (article, index) => ({
  id: `external-${index}-${Date.now()}`,
  title: article.title,
  summary: article.description || article.content || '',
  content: article.content || '',
  author: article.author || article.source?.name || 'External Source',
  category: 'external-news',
  source: 'external',
  publishedAt: article.publishedAt || new Date(),
  imageUrl: article.urlToImage,
  originalUrl: article.url,
  type: 'external',
  published: true
});

// GET /api/news - all articles
router.get('/', async (req, res) => {
  try {
    const { category, source = 'all', search, limit = 50 } = req.query;
    let all = [];

    // Custom articles
    if (source === 'all' || source === 'custom') {
      let filtered = [...customArticles].filter(a => a.published);
      if (category) filtered = filtered.filter(a => a.category === category);
      all.push(...filtered);
    }

    // External articles
    if (source === 'all' || source === 'external') {
      const ext = await fetchPetNews(search || 'pets OR dogs OR cats', 10);
      if (ext.success) {
        const formatted = ext.articles.map((a, i) => formatExternal(a, i));
        all.push(...formatted);
      }
    }

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      all = all.filter(a =>
        a.title?.toLowerCase().includes(s) ||
        a.summary?.toLowerCase().includes(s) ||
        a.content?.toLowerCase().includes(s)
      );
    }

    // Sort by newest
    all.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    res.json({
      success: true,
      data: all.slice(0, limit),
      count: all.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch news', error: err.message });
  }
});

// GET /api/news/featured
router.get('/featured', async (req, res) => {
  try {
    const featured = customArticles.filter(a => a.featured && a.published);
    const external = await fetchPetNews('pet adoption OR pet rescue', 3);
    const formatted = external.success ? external.articles.map((a, i) => formatExternal(a, i)) : [];
    const all = [...featured, ...formatted].slice(0, 6);
    res.json({ success: true, data: all });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching featured news', error: err.message });
  }
});

// GET /api/news/:id
router.get('/:id', (req, res) => {
  const id = req.params.id;
  const article = customArticles.find(a => a.id === id);
  if (article) {
    return res.json({ success: true, data: article });
  } else if (id.startsWith('external-')) {
    return res.status(404).json({
      success: false,
      message: 'External article must be viewed from the news list',
    });
  }
  res.status(404).json({ success: false, message: 'Article not found' });
});

module.exports = router;
