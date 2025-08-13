// client/src/hooks/usePetFilters.js - FIXED VERSION WITH PAGE RESET & URL SYNC

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchPetsWithFilters } from '../services/petServices';

/**
 * Enhanced pet filters hook with proper URL sync and page reset
 */
export const usePetFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false
  });

  // ✅ IMPROVED: Parse filters from URL with proper defaults
  const filters = useMemo(() => {
    const urlFilters = {
      search: searchParams.get('search') || '',
      type: searchParams.get('type') || 'all',
      category: searchParams.get('category') || 'all', 
      size: searchParams.get('size') || 'all',
      gender: searchParams.get('gender') || 'all',
      age: searchParams.get('age') || 'all',
      breed: searchParams.get('breed') || 'all',
      status: searchParams.get('status') || 'available', // Default to available
      featured: searchParams.get('featured') === 'true' ? true : 
                searchParams.get('featured') === 'false' ? false : null,
      sort: searchParams.get('sort') || 'newest',
      page: parseInt(searchParams.get('page')) || 1,
      limit: parseInt(searchParams.get('limit')) || 20
    };

    return urlFilters;
  }, [searchParams]);

  // ✅ IMPROVED: URL sync with shallow comparison to prevent loops
  const updateURL = useCallback((newFilters) => {
    const params = new URLSearchParams();
    
    // Only add non-default values to URL
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'all') {
        if (key === 'featured' && typeof value === 'boolean') {
          params.set(key, String(value));
        } else if (key === 'page' && value !== 1) {
          params.set(key, String(value));
        } else if (key === 'limit' && value !== 20) {
          params.set(key, String(value));
        } else if (key === 'sort' && value !== 'newest') {
          params.set(key, value);
        } else if (key === 'status' && value !== 'available') {
          params.set(key, value);
        } else if (!['page', 'limit', 'sort', 'status', 'featured'].includes(key)) {
          params.set(key, value);
        }
      }
    });

    // Only update URL if params actually changed
    const newParamsString = params.toString();
    const currentParamsString = searchParams.toString();
    
    if (newParamsString !== currentParamsString) {
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // ✅ CRITICAL FIX: Filter handlers that reset page to 1
  const setFilter = useCallback((key, value) => {
    const normalized = 
      ['category', 'type', 'size', 'gender', 'age', 'breed'].includes(key)
        ? (value === 'all' ? null : value)
        : key === 'search'
          ? (value?.trim() ? value.trim() : null)
          : key === 'featured'
            ? (value === 'true' ? true : value === 'false' ? false : null)
            : value;

    const newFilters = {
      ...filters,
      [key]: normalized,
      page: 1 // ✅ CRITICAL: Reset page when filter changes
    };

    updateURL(newFilters);
  }, [filters, updateURL]);

  // ✅ CRITICAL FIX: Sort handler that resets page to 1
  const setSort = useCallback((sortValue) => {
    const newFilters = {
      ...filters,
      sort: sortValue,
      page: 1 // ✅ CRITICAL: Reset page when sort changes
    };

    updateURL(newFilters);
  }, [filters, updateURL]);

  // ✅ IMPROVED: Page handler with bounds checking
  const setPage = useCallback((pageNumber) => {
    const safePage = Math.max(1, Math.min(pageNumber, pagination.totalPages || 1));
    
    if (safePage !== filters.page) {
      const newFilters = {
        ...filters,
        page: safePage
      };

      updateURL(newFilters);
    }
  }, [filters, pagination.totalPages, updateURL]);

  // ✅ IMPROVED: Clear filters handler
  const clearFilters = useCallback(() => {
    const defaultFilters = {
      search: '',
      type: 'all',
      category: 'all',
      size: 'all',
      gender: 'all', 
      age: 'all',
      breed: 'all',
      status: 'available',
      featured: null,
      sort: 'newest',
      page: 1,
      limit: 20
    };

    updateURL(defaultFilters);
  }, [updateURL]);

  // ✅ IMPROVED: Fetch pets with better error handling
  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔄 Fetching pets with filters:', filters);

      const response = await searchPetsWithFilters(filters);

      if (response.success) {
        setResults(response.data || []);
        
        // ✅ CRITICAL: Guard against undefined pagination with safe defaults
        const paginationData = response.pagination || {};
        setPagination({
          currentPage: Number(paginationData.currentPage || filters.page || 1),
          totalPages: Number(paginationData.totalPages || 1),
          totalCount: Number(response.total || paginationData.totalCount || 0),
          limit: Number(paginationData.limit || filters.limit || 20),
          hasNextPage: Boolean(paginationData.hasNextPage),
          hasPrevPage: Boolean(paginationData.hasPrevPage)
        });

        console.log('✅ Pets fetched successfully:', {
          count: response.data?.length || 0,
          pagination: paginationData
        });
      } else {
        throw new Error(response.message || 'Failed to fetch pets');
      }
    } catch (err) {
      console.error('❌ Fetch pets error:', err);
      setError(err.message || 'Failed to load pets');
      setResults([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 20,
        hasNextPage: false,
        hasPrevPage: false
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ✅ IMPROVED: Effect with dependency on filters
  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // ✅ IMPROVED: Computed values with safe defaults
  const totalResults = pagination.totalCount || 0;
  const hasResults = results.length > 0;
  const isFirstPage = pagination.currentPage <= 1;
  const isLastPage = pagination.currentPage >= pagination.totalPages;

  // ✅ IMPROVED: Active filters count for UI
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.type && filters.type !== 'all') count++;
    if (filters.category && filters.category !== 'all') count++;
    if (filters.size && filters.size !== 'all') count++;
    if (filters.gender && filters.gender !== 'all') count++;
    if (filters.age && filters.age !== 'all') count++;
    if (filters.breed && filters.breed !== 'all') count++;
    if (filters.status && filters.status !== 'available') count++;
    if (typeof filters.featured === 'boolean') count++;
    return count;
  }, [filters]);

  return {
    // Data
    results,
    loading,
    error,
    pagination,
    totalResults,
    hasResults,
    
    // Current filter state
    filters,
    activeFiltersCount,
    
    // Navigation helpers
    isFirstPage,
    isLastPage,
    
    // Actions
    setFilter,
    setSort,
    setPage,
    clearFilters,
    refetch: fetchPets
  };
};

export default usePetFilters;