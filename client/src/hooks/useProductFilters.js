// client/src/hooks/useProductFilters.js - COMPLETE PRODUCT FILTERS HOOK
import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for filtering and managing product data
 * Handles array safety to prevent errors and provides comprehensive filtering
 * @param {Array|Object} products - Array of product objects or API response object
 * @param {Object} initialFilters - Initial filter state
 * @returns {Object} Filter state and methods
 */
const useProductFilters = (products = [], initialFilters = {}) => {
  
  // ✅ CRITICAL FIX: Always ensure products is an array and sanitize data
  const safeProducts = useMemo(() => {
    console.log('🛒 useProductFilters: Input products type:', typeof products, 'isArray:', Array.isArray(products));
    
    // Handle null/undefined
    if (!products) {
      console.warn('⚠️ useProductFilters: products is null/undefined, using empty array');
      return [];
    }
    
    // If it's already an array, use it
    if (Array.isArray(products)) {
      console.log('✅ useProductFilters: products is array with length:', products.length);
      return products.filter(product => product != null).map(product => ({
        ...product,
        id: product._id || product.id, // Normalize ID field
        name: String(product.name || product.title || 'Unknown Product'),
        description: String(product.description || ''),
        category: String(product.category || 'Uncategorized'),
        brand: String(product.brand || ''),
        status: String(product.status || 'active'),
        price: parseFloat(product.price) || 0,
        stock: parseInt(product.stock) || 0,
        inStock: product.inStock !== undefined ? product.inStock : (product.stock > 0)
      }));
    }
    
    // Handle common API response structures
    if (typeof products === 'object') {
      console.log('🔄 useProductFilters: products is object, checking for common structures...');
      
      let extractedProducts = [];
      
      // Structure: { success: true, data: [...] }
      if (products.success && products.data && Array.isArray(products.data)) {
        console.log('✅ useProductFilters: Found products array at products.data (success response)');
        extractedProducts = products.data;
      }
      // Structure: { data: [...] }
      else if (products.data && Array.isArray(products.data)) {
        console.log('✅ useProductFilters: Found products array at products.data');
        extractedProducts = products.data;
      }
      // Structure: { products: [...] }
      else if (products.products && Array.isArray(products.products)) {
        console.log('✅ useProductFilters: Found products array at products.products');
        extractedProducts = products.products;
      }
      
      // Sanitize extracted products data
      if (extractedProducts.length > 0) {
        return extractedProducts.filter(product => product != null).map(product => ({
          ...product,
          id: product._id || product.id,
          name: String(product.name || product.title || 'Unknown Product'),
          description: String(product.description || ''),
          category: String(product.category || 'Uncategorized'),
          brand: String(product.brand || ''),
          status: String(product.status || 'active'),
          price: parseFloat(product.price) || 0,
          stock: parseInt(product.stock) || 0,
          inStock: product.inStock !== undefined ? product.inStock : (product.stock > 0)
        }));
      }
    }
    
    // Last resort: return empty array
    console.error('❌ useProductFilters: Could not find valid products array, using empty array. Received:', products);
    return [];
  }, [products]);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    brand: '',
    status: '',
    inStock: false,
    minPrice: '',
    maxPrice: '',
    ...initialFilters
  });

  const [sortBy, setSortBy] = useState('newest');

  // Update specific filter
  const updateFilter = useCallback((key, value) => {
    console.log('🔄 useProductFilters: Updating filter', key, '=', value);
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    console.log('🔄 useProductFilters: Resetting all filters');
    setFilters({
      search: '',
      category: '',
      brand: '',
      status: '',
      inStock: false,
      minPrice: '',
      maxPrice: '',
      ...initialFilters
    });
  }, [initialFilters]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    console.log('🔄 useProductFilters: Calculating filter options from', safeProducts.length, 'products');
    
    if (safeProducts.length === 0) {
      return {
        categories: [],
        brands: [],
        statuses: []
      };
    }

    try {
      const categories = [...new Set(safeProducts.map(product => product.category).filter(Boolean))].sort();
      const brands = [...new Set(safeProducts.map(product => product.brand).filter(Boolean))].sort();
      const statuses = [...new Set(safeProducts.map(product => product.status).filter(Boolean))].sort();

      return { categories, brands, statuses };
    } catch (error) {
      console.error('❌ useProductFilters: Error calculating filter options:', error);
      return {
        categories: [],
        brands: [],
        statuses: []
      };
    }
  }, [safeProducts]);

  // Filter products based on current filters
  const filteredProducts = useMemo(() => {
    console.log('🔄 useProductFilters: Filtering', safeProducts.length, 'products with filters:', filters);
    
    if (safeProducts.length === 0) {
      console.log('⚠️ useProductFilters: No products to filter');
      return [];
    }

    try {
      let filtered = safeProducts;

      // Apply filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(product => {
          const searchableText = [
            product.name,
            product.description,
            product.category,
            product.brand
          ].filter(Boolean).join(' ').toLowerCase();
          
          return searchableText.includes(searchTerm);
        });
      }

      if (filters.category) {
        filtered = filtered.filter(product => 
          product.category.toLowerCase().includes(filters.category.toLowerCase())
        );
      }

      if (filters.brand) {
        filtered = filtered.filter(product => 
          product.brand.toLowerCase().includes(filters.brand.toLowerCase())
        );
      }

      if (filters.status) {
        filtered = filtered.filter(product => product.status === filters.status);
      }

      if (filters.inStock) {
        filtered = filtered.filter(product => product.stock > 0);
      }

      if (filters.minPrice) {
        const minPrice = parseFloat(filters.minPrice);
        if (!isNaN(minPrice)) {
          filtered = filtered.filter(product => product.price >= minPrice);
        }
      }

      if (filters.maxPrice) {
        const maxPrice = parseFloat(filters.maxPrice);
        if (!isNaN(maxPrice)) {
          filtered = filtered.filter(product => product.price <= maxPrice);
        }
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'price':
            return a.price - b.price;
          case 'priceDesc':
            return b.price - a.price;
          case 'stock':
            return b.stock - a.stock;
          case 'category':
            return a.category.localeCompare(b.category);
          case 'oldest':
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
          case 'newest':
          default:
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
      });

      console.log(`✅ useProductFilters: Filtered ${filtered.length} products from ${safeProducts.length} total`);
      return filtered;
      
    } catch (error) {
      console.error('❌ useProductFilters: Error filtering products:', error);
      return [];
    }
  }, [safeProducts, filters, sortBy]);

  // Enhance products with proper image URLs
  const enhancedProducts = useMemo(() => {
    console.log('🔄 useProductFilters: Enhancing', filteredProducts.length, 'products with image URLs');
    
    try {
      return filteredProducts.map(product => {
        if (!product) return product;
        
        return {
          ...product,
          imageUrl: product.image_url || product.image || product.imageUrl || null,
          imageUrls: product.images || []
        };
      });
    } catch (error) {
      console.error('❌ useProductFilters: Error enhancing products:', error);
      return filteredProducts;
    }
  }, [filteredProducts]);

  // Get filter statistics
  const filterStats = useMemo(() => {
    try {
      const stats = {
        total: safeProducts.length,
        filtered: filteredProducts.length,
        active: filteredProducts.filter(product => product?.status === 'active').length,
        inactive: filteredProducts.filter(product => product?.status === 'inactive').length,
        discontinued: filteredProducts.filter(product => product?.status === 'discontinued').length,
        inStock: filteredProducts.filter(product => product?.stock > 0).length,
        outOfStock: filteredProducts.filter(product => product?.stock <= 0).length,
        lowStock: filteredProducts.filter(product => product?.stock > 0 && product?.stock <= 10).length
      };
      
      console.log('📊 useProductFilters: Filter stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ useProductFilters: Error calculating filter stats:', error);
      return {
        total: 0,
        filtered: 0,
        active: 0,
        inactive: 0,
        discontinued: 0,
        inStock: 0,
        outOfStock: 0,
        lowStock: 0
      };
    }
  }, [safeProducts, filteredProducts]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    const defaultFilters = {
      search: '',
      category: '',
      brand: '',
      status: '',
      inStock: false,
      minPrice: '',
      maxPrice: ''
    };

    const isActive = Object.keys(filters).some(key => 
      filters[key] !== defaultFilters[key]
    );
    
    console.log('🔄 useProductFilters: Has active filters:', isActive);
    return isActive;
  }, [filters]);

  // ✅ DEBUG: Log summary in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🛒 useProductFilters debug summary:', {
      inputProductsType: Array.isArray(products) ? 'array' : typeof products,
      inputProductsLength: Array.isArray(products) ? products.length : 'N/A',
      safeProductsLength: safeProducts.length,
      filteredProductsLength: filteredProducts.length,
      enhancedProductsLength: enhancedProducts.length,
      hasActiveFilters,
      currentFilters: filters,
      sortBy
    });
  }

  return {
    filters,
    sortBy,
    filteredProducts: enhancedProducts,
    filterOptions,
    filterStats,
    hasActiveFilters,
    updateFilter,
    resetFilters,
    setSortBy,
    
    // Additional helper methods
    updateFilters: (newFilters) => setFilters(prev => ({ ...prev, ...newFilters })),
    clearFilter: (key) => updateFilter(key, ''),
    
    // Raw data access (for debugging)
    rawProducts: safeProducts,
    originalProducts: products
  };
};

export default useProductFilters;