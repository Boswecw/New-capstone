// server/routes/news.js - COMPLETE IMPLEMENTATION WITH REAL NEWS DATA
const express = require('express');
const axios = require('axios');
const router = express.Router();

// ===== CONFIGURATION =====
const CACHE_DURATION = parseInt(process.env.NEWS_CACHE_DURATION) || 30 * 60 * 1000; // 30 minutes
const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Pet-related news sources for better filtering
const PET_SOURCES = [
  'petmd.com',
  'akc.org', 
  'avma.org',
  'aspca.org',
  'rover.com',
  'chewy.com',
  'petfinder.com',
  'vetstreet.com',
  'pethealthnetwork.com'
];

// ===== CACHING SYSTEM =====
let newsCache = {
  data: [],
  lastFetch: null,
  categories: [],
  lastCategoryFetch: null
};

// ===== UTILITY FUNCTIONS =====

// Check if content is pet-related
const isPetRelated = (title, description) => {
  const content = `${title} ${description || ''}`.toLowerCase();
  const petKeywords = [
    'pet', 'dog', 'cat', 'puppy', 'kitten', 'animal', 'veterinary', 'vet',
    'adoption', 'rescue', 'shelter', 'breed', 'training', 'grooming',
    'health', 'nutrition', 'care', 'wildlife', 'canine', 'feline',
    'animal welfare', 'pet care', 'dog training', 'cat behavior'
  ];
  
  return petKeywords.some(keyword => content.includes(keyword));
};

// Detect article category based on content
const detectCategory = (content) => {
  const lowercaseContent = content.toLowerCase();
  
  if (lowercaseContent.includes('adoption') || lowercaseContent.includes('shelter') || lowercaseContent.includes('rescue')) {
    return 'adoption';
  }
  if (lowercaseContent.includes('health') || lowercaseContent.includes('veterinar') || lowercaseContent.includes('medical') || lowercaseContent.includes('disease')) {
    return 'health';
  }
  if (lowercaseContent.includes('training') || lowercaseContent.includes('behavior') || lowercaseContent.includes('obedience')) {
    return 'care';
  }
  if (lowercaseContent.includes('safety') || lowercaseContent.includes('poison') || lowercaseContent.includes('danger') || lowercaseContent.includes('toxic')) {
    return 'safety';
  }
  if (lowercaseContent.includes('success') || lowercaseContent.includes('story') || lowercaseContent.includes('journey')) {
    return 'success-story';
  }
  if (lowercaseContent.includes('company') || lowercaseContent.includes('announcement') || lowercaseContent.includes('furbabies')) {
    return 'company-news';
  }
  
  return 'general';
};

// Generate unique ID for external articles
const generateArticleId = (article, source) => {
  const baseString = `${source}_${article.title}_${article.publishedAt}`;
  return Buffer.from(baseString).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
};

// ===== EXTERNAL NEWS FETCHING =====

// Fetch news from NewsAPI.org
const fetchFromNewsAPI = async (searchQuery = 'pets OR dogs OR cats OR veterinary OR "pet care"', limit = 30) => {
  try {
    if (!NEWS_API_KEY) {
      console.log('⚠️ NEWS_API_KEY not configured - skipping NewsAPI');
      return [];
    }

    console.log('📰 Fetching from NewsAPI.org...');
    
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: searchQuery,
        domains: PET_SOURCES.join(','),
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: limit,
        apiKey: NEWS_API_KEY
      },
      timeout: 15000
    });

    if (response.data.status === 'ok') {
      const articles = response.data.articles
        .filter(article => {
          // Filter out removed articles and non-pet content
          if (article.title === '[Removed]' || !article.title) return false;
          return isPetRelated(article.title, article.description);
        })
        .map(article => ({
          id: generateArticleId(article, 'newsapi'),
          _id: generateArticleId(article, 'newsapi'),
          title: article.title,
          description: article.description,
          summary: article.description ? (article.description.slice(0, 200) + (article.description.length > 200 ? '...' : '')) : '',
          content: article.content || article.description,
          imageUrl: article.urlToImage,
          originalUrl: article.url,
          publishedAt: article.publishedAt,
          author: article.author || article.source?.name,
          source: article.source?.name || 'NewsAPI',
          category: detectCategory(article.title + ' ' + (article.description || '')),
          type: 'external',
          featured: ['PetMD', 'American Kennel Club', 'AVMA', 'ASPCA'].includes(article.source?.name)
        }));
      
      console.log(`✅ NewsAPI: Retrieved ${articles.length} pet-related articles`);
      return articles;
    }
    
    return [];
  } catch (error) {
    console.error('❌ NewsAPI error:', error.response?.data?.message || error.message);
    
    // Log specific error types for debugging
    if (error.response?.status === 429) {
      console.error('💡 Rate limit exceeded - consider upgrading NewsAPI plan');
    } else if (error.response?.status === 401) {
      console.error('💡 Invalid API key - check your NEWS_API_KEY in .env');
    }
    
    return [];
  }
};

// Custom/Company articles (you can move these to a database later)
const getCustomArticles = () => {
  return [
    {
      id: 'custom-1',
      _id: 'custom-1',
      title: 'FurBabies Opens New Training Facility',
      summary: 'Our new state-of-the-art training facility is now open for group classes and private sessions.',
      description: 'We are excited to announce the opening of our new 3,000 sq ft training facility with indoor agility course and specialized areas.',
      content: `We are thrilled to announce the grand opening of our new training facility! This state-of-the-art space features:

• Indoor agility course with professional obstacles
• Separate areas for puppies and adult dogs  
• Soundproof rooms for reactive dog training
• Observation areas for owners to watch progress
• Professional-grade training equipment

Our certified trainers offer:
- Group puppy socialization classes
- Basic and advanced obedience training  
- Private one-on-one sessions
- Specialized programs for rescue dogs
- Therapy dog certification prep

Visit us Monday-Saturday 8am-7pm to tour the facility or sign up for classes. All dogs must be up-to-date on vaccinations.

Contact us at training@furbabies.com or call (555) 123-4567 to schedule your first session!`,
      category: 'company-news',
      author: 'FurBabies Team',
      featured: true,
      published: true,
      publishedAt: new Date().toISOString(),
      imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop',
      source: 'FurBabies',
      type: 'custom'
    },
    {
      id: 'custom-2', 
      _id: 'custom-2',
      title: 'December Adoption Success: 47 Pets Found Homes',
      summary: 'December was our best month yet with 47 successful adoptions, including 12 senior pets.',
      description: 'Our December adoption drive exceeded all expectations with 47 pets finding their forever homes.',
      content: `What an incredible month December has been for pet adoptions! We're excited to share that 47 wonderful animals found their forever homes, making this our most successful month to date.

**December Adoption Highlights:**
- 47 total adoptions (previous record: 35)
- 28 dogs found homes
- 19 cats found homes  
- 12 senior pets (7+ years) adopted
- 8 special needs pets placed
- 15 bonded pairs kept together

**Special Success Stories:**
- Bella & Max: 10-year-old bonded pair adopted together
- Shadow: 9-year-old cat with diabetes found specialized care
- Luna: Three-legged rescue dog adopted by veterinary family
- The "Christmas Litter": All 6 puppies adopted by Christmas Eve

**Thank You to Our Community:**
This success wouldn't be possible without our amazing volunteers, foster families, and the generous families who opened their hearts and homes.

January brings new opportunities to help more pets in need. If you're considering adoption, visit us any day of the week to meet our current residents.`,
      category: 'success-story',
      author: 'Maria Rodriguez',
      featured: true,
      published: true,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop',
      source: 'FurBabies',
      type: 'custom'
    }
  ];
};

// Fetch all news from all sources
const fetchAllNews = async () => {
  try {
    console.log('🔄 Fetching news from all sources...');
    
    // Get custom articles
    const customArticles = getCustomArticles();
    
    // Fetch from external sources
    const newsApiArticles = await fetchFromNewsAPI();
    
    // Combine all sources
    const allArticles = [
      ...customArticles,
      ...newsApiArticles
    ];
    
    // Remove duplicates by title
    const uniqueArticles = allArticles.filter((article, index, self) => 
      index === self.findIndex(a => a.title.toLowerCase() === article.title.toLowerCase())
    );
    
    // Sort by publication date (newest first)
    uniqueArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    console.log(`✅ Total articles fetched: ${uniqueArticles.length}`);
    console.log(`  • Custom articles: ${customArticles.length}`);
    console.log(`  • NewsAPI articles: ${newsApiArticles.length}`);
    console.log(`  • After deduplication: ${uniqueArticles.length}`);
    
    return uniqueArticles;
    
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    // Return just custom articles as fallback
    return getCustomArticles();
  }
};

// ===== API ROUTES =====

// GET /api/news/categories
router.get('/categories', async (req, res) => {
  try {
    console.log('📂 GET /api/news/categories');
    
    // Check if we have cached categories
    const categoryCacheValid = newsCache.lastCategoryFetch && 
      (Date.now() - newsCache.lastCategoryFetch < CACHE_DURATION);
    
    if (categoryCacheValid && newsCache.categories.length > 0) {
      console.log('📂 Using cached categories');
      return res.json({
        success: true,
        data: newsCache.categories,
        cached: true
      });
    }
    
    // Get current articles to count categories
    const cacheValid = newsCache.lastFetch && (Date.now() - newsCache.lastFetch < CACHE_DURATION);
    let articles = [];
    
    if (cacheValid && newsCache.data.length > 0) {
      articles = newsCache.data;
    } else {
      articles = await fetchAllNews();
      newsCache.data = articles;
      newsCache.lastFetch = Date.now();
    }

    // Define categories with counts
    const baseCategories = [
      { name: 'all', displayName: 'All Categories', count: articles.length },
      { name: 'general', displayName: 'General', count: 0 },
      { name: 'adoption', displayName: 'Pet Adoption', count: 0 },
      { name: 'care', displayName: 'Pet Care', count: 0 },
      { name: 'health', displayName: 'Health & Wellness', count: 0 },
      { name: 'safety', displayName: 'Pet Safety', count: 0 },
      { name: 'success-story', displayName: 'Success Stories', count: 0 },
      { name: 'company-news', displayName: 'Company News', count: 0 }
    ];

    // Count articles in each category
    const categoriesWithCounts = baseCategories.map(category => {
      if (category.name === 'all') return category;
      const count = articles.filter(article => article.category === category.name).length;
      return { ...category, count };
    });
    
    // Cache the categories
    newsCache.categories = categoriesWithCounts;
    newsCache.lastCategoryFetch = Date.now();
    
    console.log(`📂 Categories updated: ${categoriesWithCounts.length} total`);
    
    res.json({
      success: true,
      data: categoriesWithCounts,
      cached: false
    });
    
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// GET /api/news/featured
router.get('/featured', async (req, res) => {
  try {
    console.log('📰 GET /api/news/featured');
    
    const limit = parseInt(req.query.limit) || 3;
    
    // Check cache first
    const cacheValid = newsCache.lastFetch && (Date.now() - newsCache.lastFetch < CACHE_DURATION);
    let articles = [];
    
    if (cacheValid && newsCache.data.length > 0) {
      articles = newsCache.data;
      console.log('📰 Using cached data for featured articles');
    } else {
      articles = await fetchAllNews();
      newsCache.data = articles;
      newsCache.lastFetch = Date.now();
      console.log('📰 Fetched fresh data for featured articles');
    }
    
    // Get featured articles (custom articles are always featured, some external ones too)
    const featuredArticles = articles
      .filter(article => article.featured || article.type === 'custom')
      .slice(0, limit);

    console.log(`📰 Returning ${featuredArticles.length} featured articles`);

    res.json({
      success: true,
      data: featuredArticles,
      count: featuredArticles.length,
      cached: cacheValid,
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

// GET /api/news/:id - Get single article by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📰 GET /api/news/${id} - Fetching article by ID`);
    
    // Check cache first
    const cacheValid = newsCache.lastFetch && (Date.now() - newsCache.lastFetch < CACHE_DURATION);
    let articles = [];
    
    if (cacheValid && newsCache.data.length > 0) {
      articles = newsCache.data;
      console.log('📰 Using cached data to find article');
    } else {
      articles = await fetchAllNews();
      newsCache.data = articles;
      newsCache.lastFetch = Date.now();
      console.log('📰 Fetched fresh data to find article');
    }
    
    // Find the article by ID
    const article = articles.find(article => 
      article.id === id || 
      article._id === id ||
      article.id === id.toString() ||
      article._id === id.toString()
    );
    
    if (!article) {
      console.log(`❌ Article not found for ID: ${id}`);
      const availableIds = articles.map(a => a.id || a._id).slice(0, 10);
      console.log(`📋 Available article IDs (first 10): ${availableIds.join(', ')}`);
      
      return res.status(404).json({
        success: false,
        message: `Article with ID '${id}' not found`,
        availableIds: availableIds
      });
    }
    
    console.log(`✅ Article found: "${article.title}"`);
    
    res.json({
      success: true,
      data: article,
      message: 'Article retrieved successfully'
    });
    
  } catch (error) {
    console.error(`❌ Error fetching article ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching article',
      error: error.message
    });
  }
});

// GET /api/news - Get all news articles with filtering
router.get('/', async (req, res) => {
  try {
    console.log('📰 GET /api/news - Fetching articles');
    
    const { 
      search, 
      category, 
      sortBy = 'publishedAt', 
      sortOrder = 'desc', 
      limit,
      source // 'custom', 'external', or 'all'
    } = req.query;
    
    // Check cache
    const cacheValid = newsCache.lastFetch && (Date.now() - newsCache.lastFetch < CACHE_DURATION);
    let articles = [];
    
    if (cacheValid && newsCache.data.length > 0) {
      articles = newsCache.data;
      console.log('📰 Using cached articles');
    } else {
      articles = await fetchAllNews();
      newsCache.data = articles;
      newsCache.lastFetch = Date.now();
      console.log('📰 Fetched fresh articles');
    }
    
    // Apply filters
    let filteredArticles = [...articles];
    
    // Source filter
    if (source && source !== 'all') {
      filteredArticles = filteredArticles.filter(article => article.type === source);
    }
    
    // Category filter
    if (category && category !== 'all') {
      filteredArticles = filteredArticles.filter(article => article.category === category);
    }
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredArticles = filteredArticles.filter(article => 
        article.title.toLowerCase().includes(searchLower) ||
        article.summary?.toLowerCase().includes(searchLower) ||
        article.description?.toLowerCase().includes(searchLower) ||
        article.author?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort articles
    filteredArticles.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'publishedAt') {
        comparison = new Date(a.publishedAt) - new Date(b.publishedAt);
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'author') {
        comparison = (a.author || '').localeCompare(b.author || '');
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    // Apply limit
    if (limit) {
      filteredArticles = filteredArticles.slice(0, parseInt(limit));
    }
    
    console.log(`📰 Returning ${filteredArticles.length} articles (filtered from ${articles.length})`);
    
    // Create breakdown for debugging
    const breakdown = {
      total: articles.length,
      custom: articles.filter(a => a.type === 'custom').length,
      external: articles.filter(a => a.type === 'external').length,
      newsapi: articles.filter(a => a.type === 'external' && a.source !== 'The Guardian').length,
      guardian: articles.filter(a => a.source === 'The Guardian').length,
      filtered: filteredArticles.length
    };
    
    res.json({
      success: true,
      data: filteredArticles,
      count: filteredArticles.length,
      total: articles.length,
      cached: cacheValid,
      breakdown: breakdown,
      filters: {
        search: search || null,
        category: category || 'all',
        source: source || 'all',
        sortBy,
        sortOrder
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles',
      error: error.message
    });
  }
});

// POST /api/news/refresh - Manual cache refresh
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 Manual cache refresh requested');
    
    // Clear cache
    newsCache.data = [];
    newsCache.lastFetch = null;
    newsCache.categories = [];
    newsCache.lastCategoryFetch = null;
    
    // Fetch fresh data
    const articles = await fetchAllNews();
    newsCache.data = articles;
    newsCache.lastFetch = Date.now();
    
    console.log(`✅ Cache refreshed with ${articles.length} articles`);
    
    const breakdown = {
      total: articles.length,
      custom: articles.filter(a => a.type === 'custom').length,
      external: articles.filter(a => a.type === 'external').length
    };
    
    res.json({
      success: true,
      message: `Cache refreshed successfully with ${articles.length} articles`,
      data: articles,
      breakdown: breakdown,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error refreshing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh cache',
      error: error.message
    });
  }
});

// GET /api/news/test/config - Test configuration endpoint
router.get('/test/config', (req, res) => {
  try {
    const config = {
      success: true,
      timestamp: new Date().toISOString(),
      config: {
        newsAPI: {
          configured: !!NEWS_API_KEY,
          keyLength: NEWS_API_KEY ? NEWS_API_KEY.length : 0,
          keyPreview: NEWS_API_KEY ? `${NEWS_API_KEY.slice(0, 8)}...` : null
        },
        cache: {
          duration: CACHE_DURATION,
          durationMinutes: Math.round(CACHE_DURATION / (60 * 1000)),
          lastFetch: newsCache.lastFetch ? new Date(newsCache.lastFetch).toISOString() : null,
          articlesInCache: newsCache.data.length
        },
        sources: {
          petDomains: PET_SOURCES.length,
          customArticles: getCustomArticles().length
        }
      }
    };
    
    console.log('🔧 Configuration check requested:', {
      newsAPIConfigured: !!NEWS_API_KEY,
      cacheSize: newsCache.data.length
    });
    
    res.json(config);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Configuration check failed',
      error: error.message
    });
  }
});

module.exports = router;