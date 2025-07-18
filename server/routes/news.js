// ==========================================
// server/routes/news.js - UPDATED HYBRID NEWS SYSTEM
// ==========================================
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { 
  fetchPetNews, 
  searchPetNewsByTopic, 
  getTrendingPetNews,
  testNewsAPIConnection,
  getFallbackNews 
} = require('../services/newsAPI');

// ===== MOCK CUSTOM CMS DATA =====
const customNewsData = [
  {
    id: 'custom-1',
    title: 'FurBabies Success Story: Max Finds His Forever Home',
    summary: 'Follow Max the Golden Retriever\'s heartwarming journey from our shelter to a loving family.',
    content: `
      <p>When Max arrived at our shelter six months ago, he was timid and uncertain about his future. The 3-year-old Golden Retriever had been surrendered by his previous family due to housing changes, and you could see the confusion in his gentle brown eyes.</p>
      
      <p>Our dedicated staff worked patiently with Max, helping him regain confidence through daily walks, training sessions, and lots of love. Within weeks, his true personality began to shine through - playful, loyal, and incredibly loving.</p>
      
      <p>Then came the Johnson family, who had been looking for the perfect companion for their two children. It was love at first sight when they met Max during our Saturday adoption event. The connection was immediate and undeniable.</p>
      
      <p>Today, Max is thriving in his forever home, enjoying long walks in the park, playing fetch with the kids, and serving as the family's official greeter for all visitors. His transformation from uncertain shelter dog to beloved family member reminds us why we do this work every day.</p>
      
      <p><strong>Interested in adoption?</strong> Visit our adoption center or browse our available pets online. Every pet deserves a story like Max's.</p>
    `,
    category: 'success-story',
    author: 'FurBabies Team',
    source: 'internal',
    featured: true,
    published: true,
    publishedAt: new Date('2024-12-10'),
    views: 1567,
    likes: 234,
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop&q=80',
    tags: ['adoption', 'success-story', 'dogs', 'golden-retriever'],
    type: 'custom'
  },
  {
    id: 'custom-2',
    title: 'Holiday Pet Safety Tips from Our Veterinary Team',
    summary: 'Essential safety tips to keep your furry friends safe during the holiday season.',
    content: `
      <p>The holidays are wonderful but also present unique challenges for pets. Our veterinary team has compiled essential safety tips to help you keep your furry family members safe and healthy during the festive season.</p>
      
      <h3>🎄 Christmas Tree Safety</h3>
      <ul>
        <li>Secure your tree to prevent tipping if curious pets climb or jump on it</li>
        <li>Avoid tinsel, which can cause serious intestinal blockages if ingested</li>
        <li>Use pet-safe ornaments placed higher on the tree, away from reaching paws</li>
        <li>Keep electrical cords hidden or protected to prevent chewing</li>
      </ul>
      
      <h3>🍯 Food Hazards to Avoid</h3>
      <ul>
        <li><strong>Chocolate:</strong> Especially dark chocolate, can be toxic to pets</li>
        <li><strong>Xylitol:</strong> Found in sugar-free gum and candies, extremely dangerous</li>
        <li><strong>Grapes and raisins:</strong> Can cause kidney failure in dogs</li>
        <li><strong>Onions and garlic:</strong> Can damage red blood cells</li>
        <li><strong>Bones:</strong> Cooked bones can splinter and cause choking</li>
      </ul>
      
      <h3>🎁 Gift and Decoration Safety</h3>
      <p>Keep wrapped gifts out of reach, as ribbon and wrapping paper can be choking hazards. Be mindful of small decorative items that could be swallowed.</p>
      
      <p><strong>Emergency Contact:</strong> Keep your veterinarian's number handy, and know the location of your nearest emergency animal hospital.</p>
    `,
    category: 'safety',
    author: 'Dr. Sarah Johnson, DVM',
    source: 'internal',
    featured: true,
    published: true,
    publishedAt: new Date('2024-12-15'),
    views: 980,
    likes: 67,
    readTime: '5 min read',
    imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&h=400&fit=crop&q=80',
    tags: ['safety', 'holidays', 'health', 'prevention'],
    type: 'custom'
  },
  {
    id: 'custom-3',
    title: 'New Adoption Center Opens Downtown',
    summary: 'We\'re excited to announce the opening of our new state-of-the-art adoption facility.',
    content: `
      <p>We're thrilled to announce the grand opening of our new FurBabies Adoption Center in downtown! This 5,000 square foot facility represents a major step forward in our mission to connect pets with loving families.</p>
      
      <h3>🏢 Facility Features</h3>
      <ul>
        <li>Spacious meet-and-greet rooms for families to bond with potential pets</li>
        <li>Separate areas for cats, dogs, and small animals</li>
        <li>On-site veterinary clinic for health checkups and vaccinations</li>
        <li>Training room for behavior classes and workshops</li>
        <li>Retail area with premium pet supplies</li>
      </ul>
      
      <h3>📍 Location & Hours</h3>
      <p><strong>Address:</strong> 123 Main Street, Downtown District</p>
      <p><strong>Hours:</strong></p>
      <ul>
        <li>Monday - Friday: 10:00 AM - 7:00 PM</li>
        <li>Saturday: 9:00 AM - 6:00 PM</li>
        <li>Sunday: 11:00 AM - 5:00 PM</li>
      </ul>
      
      <h3>🎉 Grand Opening Events</h3>
      <p>Join us for our grand opening celebration featuring:</p>
      <ul>
        <li>Free health screenings for current pets</li>
        <li>Adoption specials with reduced fees</li>
        <li>Pet training demonstrations</li>
        <li>Food truck and live music</li>
      </ul>
      
      <p>We can't wait to welcome you to our new space and help you find your perfect companion!</p>
    `,
    category: 'company-news',
    author: 'FurBabies Team',
    source: 'internal',
    featured: true,
    published: true,
    publishedAt: new Date('2024-12-01'),
    views: 1250,
    likes: 89,
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop&q=80',
    tags: ['adoption', 'company', 'facility', 'grand-opening'],
    type: 'custom'
  }
];

// ===== UTILITY FUNCTIONS =====
const formatExternalArticle = (article, index) => ({
  id: `external-${index}-${Date.now()}`,
  title: article.title || 'Pet News Article',
  summary: article.description || article.content?.substring(0, 200) + '...' || 'Read more about this pet-related story.',
  content: article.content || article.description || 'Full article content available at source.',
  category: 'external-news',
  author: article.source?.name || article.author || 'External Source',
  source: 'external',
  featured: false,
  published: true,
  publishedAt: new Date(article.publishedAt || new Date()),
  views: Math.floor(Math.random() * 1000) + 100,
  likes: Math.floor(Math.random() * 50) + 5,
  readTime: `${Math.ceil((article.content?.split(' ').length || 300) / 200)} min read`,
  imageUrl: article.urlToImage || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop&q=80',
  tags: ['external', 'pet-news'],
  type: 'external',
  originalUrl: article.url
});

// ===== HEALTH CHECK ENDPOINT =====
// GET /api/news/health - Check news service health
router.get('/health', async (req, res) => {
  try {
    console.log('🔍 Checking news service health...');
    
    const newsApiTest = await testNewsAPIConnection();
    const customArticlesCount = customNewsData.filter(a => a.published).length;
    
    res.json({
      success: true,
      message: 'News service health check',
      services: {
        customCMS: {
          status: 'operational',
          articles: customArticlesCount,
          featured: customNewsData.filter(a => a.featured && a.published).length
        },
        externalAPI: {
          status: newsApiTest.success ? 'operational' : 'fallback',
          configured: newsApiTest.configured,
          message: newsApiTest.message
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ News health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'News service health check failed',
      error: error.message
    });
  }
});

// ===== MIXED NEWS ENDPOINTS =====

// GET /api/news/featured - Get featured articles (custom + external)
router.get('/featured', async (req, res) => {
  try {
    console.log('📰 GET /api/news/featured - Fetching mixed content');
    
    const limit = parseInt(req.query.limit) || 6;
    const customFeatured = customNewsData.filter(article => article.featured && article.published);
    
    // Get some external news to supplement
    console.log('🌐 Fetching external news to supplement featured content...');
    const externalNewsResult = await fetchPetNews('trending pets OR pet adoption OR animal rescue', 3);
    let externalArticles = [];
    
    if (externalNewsResult.success && !externalNewsResult.isFallback) {
      externalArticles = externalNewsResult.articles
        .slice(0, 3)
        .map((article, index) => formatExternalArticle(article, index));
      console.log(`✅ External: ${externalArticles.length} articles from NewsAPI.org`);
    } else {
      console.log('⚠️ External news unavailable, using custom content only');
    }

    // Mix custom and external, prioritize custom
    const mixedArticles = [
      ...customFeatured,
      ...externalArticles
    ]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, limit);

    console.log(`📰 Featured: ${customFeatured.length} custom + ${externalArticles.length} external = ${mixedArticles.length} total`);

    res.json({
      success: true,
      data: mixedArticles,
      count: mixedArticles.length,
      breakdown: {
        custom: customFeatured.length,
        external: externalArticles.length,
        externalSource: externalNewsResult.isFallback ? 'fallback' : 'live'
      },
      message: 'Featured news articles retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching featured news:', error);
    
    // Fallback to custom articles only
    const fallbackArticles = customNewsData
      .filter(article => article.featured && article.published)
      .slice(0, parseInt(req.query.limit) || 6);
    
    res.json({
      success: true,
      data: fallbackArticles,
      count: fallbackArticles.length,
      breakdown: {
        custom: fallbackArticles.length,
        external: 0,
        externalSource: 'unavailable'
      },
      message: 'Featured news articles retrieved (custom only due to external service issue)',
      warning: 'External news service temporarily unavailable'
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
      if (category && category !== 'all' && category !== 'external-news') {
        customArticles = customArticles.filter(article => article.category === category);
      }
      
      allArticles.push(...customArticles);
      console.log(`📝 Custom: ${customArticles.length} articles included`);
    }

    // Include external articles if requested
    if (source === 'all' || source === 'external') {
      const externalLimit = source === 'external' ? parseInt(limit) : Math.min(10, parseInt(limit));
      const searchQuery = search || 'pets OR dogs OR cats OR animal adoption OR pet care';
      
      console.log(`🌐 Fetching external news with query: "${searchQuery}"`);
      const externalNewsResult = await fetchPetNews(searchQuery, externalLimit);
      
      if (externalNewsResult.success) {
        const externalArticles = externalNewsResult.articles
          .map((article, index) => formatExternalArticle(article, index));
        allArticles.push(...externalArticles);
        console.log(`✅ External: ${externalArticles.length} articles (${externalNewsResult.isFallback ? 'fallback' : 'live'})`);
      } else {
        console.log('⚠️ External news fetch failed, continuing with custom only');
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
      allArticles.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sort === 'liked') {
      allArticles.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    // Apply final limit
    const paginatedArticles = allArticles.slice(0, parseInt(limit));

    console.log(`📰 Final result: ${paginatedArticles.length} articles returned`);

    res.json({
      success: true,
      data: paginatedArticles,
      count: paginatedArticles.length,
      total: allArticles.length,
      breakdown: {
        custom: paginatedArticles.filter(a => a.type === 'custom').length,
        external: paginatedArticles.filter(a => a.type === 'external').length
      },
      filters: { source, category, search, sort },
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
      const formattedArticles = result.articles.map((article, index) => 
        formatExternalArticle(article, index)
      );
      
      res.json({
        success: true,
        data: formattedArticles,
        count: formattedArticles.length,
        totalResults: result.totalResults,
        source: result.source,
        isFallback: result.isFallback || false,
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
    // Count articles in each category
    const successStoryCount = customNewsData.filter(a => a.category === 'success-story' && a.published).length;
    const safetyCount = customNewsData.filter(a => a.category === 'safety' && a.published).length;
    const companyCount = customNewsData.filter(a => a.category === 'company-news' && a.published).length;
    
    const categories = [
      { name: 'all', displayName: 'All Articles', count: customNewsData.filter(a => a.published).length, type: 'filter' },
      { name: 'success-story', displayName: 'Success Stories', count: successStoryCount, type: 'custom' },
      { name: 'safety', displayName: 'Pet Safety', count: safetyCount, type: 'custom' },
      { name: 'company-news', displayName: 'Company News', count: companyCount, type: 'custom' },
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
    let article = customNewsData.find(article => 
      article.id === id && article.published
    );

    if (article) {
      console.log(`✅ Found custom article: ${article.title}`);
      res.json({
        success: true,
        data: article,
        source: 'Custom CMS',
        message: 'Article retrieved successfully'
      });
    } else if (id.startsWith('external-')) {
      // For external articles, we'd need to fetch from cache or return error
      console.log('⚠️ External article requested but not cached');
      res.status(404).json({
        success: false,
        message: 'External article not found in cache. Please browse from news list.',
        suggestion: 'External articles are fetched dynamically. Return to the news page to view current articles.'
      });
    } else {
      console.log('❌ Article not found');
      res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
  } catch (error) {
    console.error('❌ Error fetching article:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching article',
      error: error.message
    });
  }
});

// POST /api/news/:id/like - Like an article (custom articles only)
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    
    const articleIndex = customNewsData.findIndex(article => 
      article.id === id && article.published
    );

    if (articleIndex !== -1) {
      customNewsData[articleIndex].likes = (customNewsData[articleIndex].likes || 0) + 1;
      
      res.json({
        success: true,
        data: {
          id: id,
          likes: customNewsData[articleIndex].likes
        },
        message: 'Article liked successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Article not found or cannot be liked'
      });
    }
  } catch (error) {
    console.error('❌ Error liking article:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking article',
      error: error.message
    });
  }
});

// ===== TESTING ENDPOINTS =====

// GET /api/news/test/connection - Test NewsAPI.org connection
router.get('/test/connection', async (req, res) => {
  try {
    const result = await testNewsAPIConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message
    });
  }
});

// GET /api/news/test/fetch - Test fetching external news
router.get('/test/fetch', async (req, res) => {
  try {
    const query = req.query.q || 'pets';
    const limit = parseInt(req.query.limit) || 5;
    
    console.log(`🧪 Testing news fetch: "${query}" (limit: ${limit})`);
    const result = await fetchPetNews(query, limit);
    
    res.json({
      test: true,
      query,
      limit,
      result
    });
  } catch (error) {
    res.status(500).json({
      test: true,
      success: false,
      message: 'Fetch test failed',
      error: error.message
    });
  }
});

module.exports = router;