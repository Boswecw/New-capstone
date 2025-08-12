const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');

// ✅ ENHANCED: Optimized filter parsing
const parseFilters = (query) => {
  const filters = {};
  
  // Text search
  if (query.search && query.search.trim()) {
    filters.$text = { $search: query.search.trim() };
  }
  
  // Category filter
  if (query.category && query.category !== 'all') {
    filters.category = query.category;
  }
  
  // Type filter  
  if (query.type && query.type !== 'all') {
    filters.type = query.type;
  }
  
  // Size filter
  if (query.size && query.size !== 'all') {
    filters.size = query.size;
  }
  
  // Gender filter
  if (query.gender && query.gender !== 'all') {
    filters.gender = query.gender;
  }
  
  // Age filter - handle both exact and range
  if (query.age && query.age !== 'all') {
    if (query.age.includes('-')) {
      // Age range like "1-2 years"
      filters.age = { $regex: query.age.replace('-', '.*'), $options: 'i' };
    } else {
      // Exact age match
      filters.age = { $regex: query.age, $options: 'i' };
    }
  }
  
  // Featured filter
  if (query.featured === 'true') {
    filters.featured = true;
  }
  
  // Status filter (always filter for available unless specified)
  filters.status = query.status || 'available';
  
  // Breed filter
  if (query.breed && query.breed !== 'all') {
    filters.breed = { $regex: query.breed, $options: 'i' };
  }
  
  return filters;
};

// ✅ ENHANCED: Pagination with performance optimization
const parsePaginationOptions = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20)); // Cap at 50
  const sort = query.sort || 'newest';
  
  // Sort options
  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name: { name: 1 },
    featured: { featured: -1, createdAt: -1 },
    type: { type: 1, name: 1 }
  };
  
  return {
    page,
    limit,
    sort: sortOptions[sort] || sortOptions.newest,
    skip: (page - 1) * limit
  };
};

// ✅ OPTIMIZED: Main pets endpoint with aggregation pipeline
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    console.log('🔍 GET /api/pets - Query:', req.query);
    
    const filters = parseFilters(req.query);
    const options = parsePaginationOptions(req.query);
    
    console.log('🔍 Parsed filters:', filters);
    console.log('🔍 Pagination options:', options);
    
    // Build aggregation pipeline for better performance
    const pipeline = [
      // Match stage - apply all filters
      { $match: filters },
      
      // Add computed fields
      {
        $addFields: {
          imageUrl: {
            $cond: {
              if: { $and: [{ $ne: ["$image", null] }, { $ne: ["$image", ""] }] },
              then: { $concat: ["https://storage.googleapis.com/furbabies-petstore/", "$image"] },
              else: null
            }
          },
          hasImage: {
            $cond: {
              if: { $and: [{ $ne: ["$image", null] }, { $ne: ["$image", ""] }] },
              then: true,
              else: false
            }
          },
          displayName: {
            $cond: {
              if: { $eq: ["$name", ""] },
              then: "Unnamed Pet",
              else: "$name"
            }
          }
        }
      },
      
      // Facet for pagination and counts
      {
        $facet: {
          // Get paginated results
          pets: [
            { $sort: options.sort },
            { $skip: options.skip },
            { $limit: options.limit }
          ],
          
          // Get total count
          totalCount: [
            { $count: "count" }
          ],
          
          // Get filter counts for UI
          filterCounts: [
            {
              $group: {
                _id: null,
                categories: {
                  $push: "$category"
                },
                types: {
                  $push: "$type"
                },
                sizes: {
                  $push: "$size"
                },
                genders: {
                  $push: "$gender"
                }
              }
            }
          ]
        }
      }
    ];
    
    // Execute aggregation
    const [result] = await Pet.aggregate(pipeline);
    const executionTime = Date.now() - startTime;
    
    // Process results
    const pets = result.pets || [];
    const totalCount = result.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / options.limit);
    
    // Calculate filter counts
    let filterCounts = {};
    if (result.filterCounts[0]) {
      const counts = result.filterCounts[0];
      filterCounts = {
        categories: countOccurrences(counts.categories),
        types: countOccurrences(counts.types),
        sizes: countOccurrences(counts.sizes),
        genders: countOccurrences(counts.genders)
      };
    }
    
    console.log(`✅ Query completed in ${executionTime}ms - Found ${pets.length}/${totalCount} pets`);
    
    res.json({
      success: true,
      data: pets,
      pagination: {
        page: options.page,
        limit: options.limit,
        total: totalCount,
        totalPages,
        hasNext: options.page < totalPages,
        hasPrev: options.page > 1
      },
      filters: filters,
      filterCounts,
      performance: {
        executionTime,
        resultsCount: pets.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error in pets filter endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error filtering pets',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ UTILITY: Count occurrences helper
const countOccurrences = (array) => {
  return array.reduce((acc, item) => {
    if (item) {
      acc[item] = (acc[item] || 0) + 1;
    }
    return acc;
  }, {});
};

// ✅ NEW: Get filter metadata endpoint
router.get('/meta/filters', async (req, res) => {
  try {
    console.log('🔍 GET /api/pets/meta/filters');
    
    const pipeline = [
      { $match: { status: 'available' } },
      {
        $group: {
          _id: null,
          categories: { $addToSet: "$category" },
          types: { $addToSet: "$type" },
          breeds: { $addToSet: "$breed" },
          sizes: { $addToSet: "$size" },
          genders: { $addToSet: "$gender" },
          ages: { $addToSet: "$age" }
        }
      }
    ];
    
    const [metadata] = await Pet.aggregate(pipeline);
    
    if (!metadata) {
      return res.json({
        success: true,
        data: {
          categories: [],
          types: [],
          breeds: [],
          sizes: [],
          genders: [],
          ages: []
        }
      });
    }
    
    // Clean and sort the arrays
    const cleanAndSort = (arr) => {
      return arr
        .filter(item => item && item.trim())
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'accent' }));
    };
    
    res.json({
      success: true,
      data: {
        categories: cleanAndSort(metadata.categories || []),
        types: cleanAndSort(metadata.types || []),
        breeds: cleanAndSort(metadata.breeds || []),
        sizes: cleanAndSort(metadata.sizes || []),
        genders: cleanAndSort(metadata.genders || []),
        ages: cleanAndSort(metadata.ages || [])
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching filter metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching filter metadata',
      error: error.message
    });
  }
});

module.exports = router;
