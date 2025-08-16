// server/routes/news.js - Server-side external news fetching
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Cache for news articles (simple in-memory cache)
let newsCache = {
  data: [],
  lastFetch: null,
  CACHE_DURATION: 30 * 60 * 1000 // 30 minutes
};

// Pet-related keywords and sources
const PET_SOURCES = [
  'petmd.com',
  'akc.org',
  'avma.org',
  'petfinder.com',
  'aspca.org',
  'rover.com',
  'chewy.com',
  'vetstreet.com',
  'pethealthnetwork.com'
];

const PET_KEYWORDS = [
  'pet care',
  'veterinary',
  'animal health',
  'pet adoption',
  'animal welfare',
  'dog training',
  'cat care',
  'pet nutrition',
  'pet health',
  'animal rescue'
];

// Detect article category based on content
const detectCategory = (content) => {
  const lowercaseContent = content.toLowerCase();
  
  if (lowercaseContent.includes('veterinar') || lowercaseContent.includes('vet ') || lowercaseContent.includes('health')) {
    return 'veterinary';
  }
  if (lowercaseContent.includes('adoption') || lowercaseContent.includes('shelter') || lowercaseContent.includes('rescue')) {
    return 'pet adoption';
  }
  if (lowercaseContent.includes('nutrition') || lowercaseContent.includes('food') || lowercaseContent.includes('diet')) {
    return 'pet nutrition';
  }
  if (lowercaseContent.includes('training') || lowercaseContent.includes('behavior')) {
    return 'pet training';
  }
  if (lowercaseContent.includes('dog')) {
    return 'dog care';
  }
  if (lowercaseContent.includes('cat')) {
    return 'cat care';
  }
  return 'pet care';
};

// Check if content is pet-related
const isPetRelated = (title, description) => {
  const content = `${title} ${description || ''}`.toLowerCase();
  
  return PET_KEYWORDS.some(keyword => content.includes(keyword.toLowerCase())) ||
         content.includes('pet') ||
         content.includes('animal') ||
         content.includes('dog') ||
         content.includes('cat') ||
         content.includes('veterinar') ||
         content.includes('puppy') ||
         content.includes('kitten');
};

// Fetch news from NewsAPI
const fetchFromNewsAPI = async (searchQuery) => {
  try {
    const API_KEY = process.env.NEWS_API_KEY;
    if (!API_KEY) {
      console.log('⚠️ NEWS_API_KEY not set, skipping NewsAPI');
      return [];
    }

    console.log('📰 Fetching from NewsAPI...');
    
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: searchQuery || 'pets OR veterinary OR "animal health" OR "pet care"',
        domains: PET_SOURCES.join(','),
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 50,
        apiKey: API_KEY
      },
      timeout: 10000
    });

    if (response.data.status === 'ok') {
      return response.data.articles
        .filter(article => {
          if (article.title === '[Removed]' || !article.title) return false;
          return isPetRelated(article.title, article.description);
        })
        .map(article => ({
          _id: `newsapi_${Buffer.from(article.url).toString('base64').slice(0, 20)}`,
          title: article.title,
          description: article.description,
          summary: article.description?.slice(0, 200) + '...',
          imageUrl: article.urlToImage,
          originalUrl: article.url,
          publishedAt: article.publishedAt,
          author: article.author || article.source?.name,
          source: article.source?.name,
          category: detectCategory(article.title + ' ' + (article.description || '')),
          type: 'external',
          featured: ['PetMD', 'American Kennel Club', 'AVMA'].includes(article.source?.name)
        }));
    }
    
    return [];
  } catch (error) {
    console.error('❌ NewsAPI error:', error.message);
    return [];
  }
};

// Fetch news from Guardian API (alternative source)
const fetchFromGuardian = async (searchQuery) => {
  try {
    const API_KEY = process.env.GUARDIAN_API_KEY;
    if (!API_KEY) {
      console.log('⚠️ GUARDIAN_API_KEY not set, skipping Guardian');
      return [];
    }

    console.log('📰 Fetching from Guardian API...');

    const response = await axios.get('https://content.guardianapis.com/search', {
      params: {
        q: searchQuery || 'pets OR animals OR veterinary',
        section: 'lifeandstyle|science',
        'show-fields': 'thumbnail,trailText,byline',
        'page-size': 20,
        'api-key': API_KEY
      },
      timeout: 10000
    });

    if (response.data.response?.status === 'ok') {
      return response.data.response.results
        .filter(article => isPetRelated(article.webTitle, article.fields?.trailText))
        .map(article => ({
          _id: `guardian_${article.id}`,
          title: article.webTitle,
          description: article.fields?.trailText,
          summary: article.fields?.trailText?.slice(0, 200) + '...',
          imageUrl: article.fields?.thumbnail,
          originalUrl: article.webUrl,
          publishedAt: article.webPublicationDate,
          author: article.fields?.byline || 'The Guardian',
          source: 'The Guardian',
          category: detectCategory(article.webTitle + ' ' + (article.fields?.trailText || '')),
          type: 'external',
          featured: false
        }));
    }
    
    return [];
  } catch (error) {
    console.error('❌ Guardian API error:', error.message);
    return [];
  }
};

// Get mock pet news as fallback
const getMockPetNews = () => {
  return [
    {
      _id: 'mock-1',
      title: 'New Study Reveals Benefits of Regular Vet Checkups',
      description: 'Veterinary researchers find that pets with regular checkups live 20% longer on average.',
      summary: 'A comprehensive study shows the importance of preventive veterinary care for pet longevity.',
      imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&h=250&fit=crop&q=80',
      originalUrl: '#',
      publishedAt: new Date().toISOString(),
      author: 'Pet Health Today',
      source: 'Pet Health Today',
      category: 'veterinary',
      type: 'external',
      featured: true
    },
    {
      _id: 'mock-2',
      title: 'Top 10 Pet Nutrition Tips for 2024',
      description: 'Expert veterinarians share essential nutrition guidelines for keeping your pets healthy.',
      summary: 'Learn the latest in pet nutrition science and feeding best practices.',
      imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=250&fit=crop&q=80',
      originalUrl: '#',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      author: 'Dr. Sarah Johnson',
      source: 'Veterinary Weekly',
      category: 'pet nutrition',
      type: 'external',
      featured: false
    },
    {
      _id: 'mock-3',
      title: 'Record Number of Pet Adoptions This Month',
      description: 'Local shelters report 40% increase in successful pet adoptions compared to last year.',
      summary: 'Great news for animal welfare as more pets find loving homes.',
      imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=250&fit=crop&q=80',
      originalUrl: '#',
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      author: 'Animal Shelter Network',
      source: 'Pet Adoption News',
      category: 'pet adoption',
      type: 'external',
      featured: false
    },
    {
      _id: 'mock-4',
      title: 'Understanding Your Cat\'s Behavior: Expert Tips',
      description: 'Feline behaviorists explain common cat behaviors and what they mean.',
      summary: 'Decode your cat\'s mysterious behaviors with help from animal experts.',
      imageUrl: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=250&fit=crop&q=80',
      originalUrl: '#',
      publishedAt: new Date(Date.now() - 259200000).toISOString(),
      author: 'Dr. Lisa Martinez',
      source: 'Cat Behavior Institute',
      category: 'cat care',
      type: 'external',
      featured: false
    },
    {
      _id: 'mock-5',
      title: 'Dog Training: Positive Reinforcement Methods',
      description: 'Modern dog training techniques that strengthen the bond between you and your pet.',
      summary: 'Discover effective, humane training methods for dogs of all ages.',
      imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=250&fit=crop&q=80',
      originalUrl: '#',
      publishedAt: new Date(Date.now() - 345600000).toISOString(),
      author: 'Mike Thompson',
      source: 'Dog Training Today',
      category: 'dog care',
      type: 'external',
      featured: false
    }
  ];
};

// Main route to get all news
router.get('/', async (req, res) => {
  try {
    console.log('📰 GET /api/news - Fetching pet news...');
    
    const { search, category, sortBy = 'publishedAt', sortOrder = 'desc' } = req.query;
    
    // Check cache first
    const now = Date.now();
    const cacheValid = newsCache.lastFetch && (now - newsCache.lastFetch) < newsCache.CACHE_DURATION;
    
    let articles = [];
    
    if (cacheValid && newsCache.data.length > 0) {
      console.log('📰 Using cached news data');
      articles = [...newsCache.data];
    } else {
      console.log('📰 Fetching fresh news data...');
      
      // Fetch from multiple sources
      const [newsApiArticles, guardianArticles] = await Promise.all([
        fetchFromNewsAPI(search),
        fetchFromGuardian(search)
      ]);
      
      // Combine all sources
      articles = [
        ...newsApiArticles,
        ...guardianArticles
      ];
      
      // If no external articles, use mock data
      if (articles.length === 0) {
        console.log('📰 No external articles found, using mock data');
        articles = getMockPetNews();
      }
      
      // Update cache
      newsCache.data = articles;
      newsCache.lastFetch = now;
      
      console.log(`✅ Cached ${articles.length} news articles`);
    }
    
    // Apply filters
    let filteredArticles = articles;
    
    // Search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredArticles = filteredArticles.filter(article =>
        article.title.toLowerCase().includes(searchTerm) ||
        (article.description && article.description.toLowerCase().includes(searchTerm))
      );
    }
    
    // Category filter
    if (category && category !== 'all') {
      filteredArticles = filteredArticles.filter(article =>
        article.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    // Sort articles
    filteredArticles.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'publishedAt':
        default:
          const dateA = new Date(a.publishedAt);
          const dateB = new Date(b.publishedAt);
          comparison = dateA - dateB;
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    console.log(`📰 Returning ${filteredArticles.length} filtered articles`);
    
    res.json({
      success: true,
      data: filteredArticles,
      total: filteredArticles.length,
      cached: cacheValid
    });
    
  } catch (error) {
    console.error('❌ Error in news route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news',
      error: error.message
    });
  }
});

// Route to get news categories
router.get('/categories', (req, res) => {
  const categories = [
    'veterinary',
    'pet care',
    'pet adoption',
    'pet nutrition',
    'dog care',
    'cat care',
    'animal health',
    'pet training'
  ];
  
  res.json({
    success: true,
    data: categories
  });
});

// Route to refresh news cache
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 Manually refreshing news cache...');
    
    // Clear cache
    newsCache.data = [];
    newsCache.lastFetch = null;
    
    // Fetch fresh data
    const [newsApiArticles, guardianArticles] = await Promise.all([
      fetchFromNewsAPI(),
      fetchFromGuardian()
    ]);
    
    const articles = [
      ...newsApiArticles,
      ...guardianArticles
    ];
    
    if (articles.length === 0) {
      articles.push(...getMockPetNews());
    }
    
    // Update cache
    newsCache.data = articles;
    newsCache.lastFetch = Date.now();
    
    res.json({
      success: true,
      message: `Refreshed ${articles.length} articles`,
      data: articles
    });
    
  } catch (error) {
    console.error('❌ Error refreshing news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh news',
      error: error.message
    });
  }
});

module.exports = router;