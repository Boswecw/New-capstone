// client/src/hooks/usePetFilters.js - ENHANCED with stable dependencies (FIXED)
import { useReducer, useEffect, useCallback, useState, useRef, useMemo } from "react";
import { searchPetsWithFilters } from "../services/petServices";
import { debounce } from "lodash";

// Initial filter state
const initialFilterState = {
  search: "",
  category: "all",
  type: "all",
  size: "all",
  gender: "all",
  age: "all",
  breed: "all",
  featured: null,
  status: "available",
  sort: "newest",
  page: 1,
  limit: 20
};

// ✅ Clean filters function to remove empty/default values
const cleanFilters = (filters) => {
  const cleaned = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '' && value !== 'all') {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

// ✅ Default pagination structure
const defaultPagination = {
  currentPage: 1,
  totalPages: 1,
  totalPets: 0,
  hasNext: false,
  hasPrev: false,
  total: 0
};

// Reducer for managing filter state
const filterReducer = (state, action) => {
  switch (action.type) {
    case "SET_FILTER":
      return {
        ...state,
        [action.key]: action.value,
        page: 1
      };

    case "SET_MULTIPLE_FILTERS":
      return {
        ...state,
        ...action.filters,
        page: 1
      };

    case "CLEAR_FILTERS":
      return {
        ...initialFilterState,
        sort: state.sort,
        limit: state.limit
      };

    case "SET_PAGE":
      return { ...state, page: action.page };

    case "SET_SORT":
      return { ...state, sort: action.sort, page: 1 };

    default:
      return state;
  }
};

export const usePetFilters = () => {
  const [filters, dispatch] = useReducer(filterReducer, initialFilterState);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(defaultPagination);
  const [filterCounts, setFilterCounts] = useState({});
  const [lastSearchTime, setLastSearchTime] = useState(0);

  // ✅ Stable query string to prevent unnecessary re-renders
  const stableQuery = useMemo(() => {
    const cleaned = cleanFilters(filters);
    return JSON.stringify(cleaned);
  }, [filters]);

  // ✅ Request cancellation ref
  const cancelRef = useRef(null);

  // ✅ Search function with cancellation support
  const executeSearch = useCallback(async (searchFilters) => {
    const searchStartTime = Date.now();
    
    console.log("🔍 Fetching pets with params:", new URLSearchParams(searchFilters).toString());
    
    // Cancel previous request if it's still running
    if (cancelRef.current) {
      cancelRef.current.cancelled = true;
    }
    
    // Create new cancellation token
    const currentRequest = { cancelled: false };
    cancelRef.current = currentRequest;
    
    try {
      const response = await searchPetsWithFilters(searchFilters);
      
      // Check if request was cancelled
      if (currentRequest.cancelled) {
        console.log('🚫 Request cancelled');
        return false;
      }

      if (response.data?.success) {
        const newResults = response.data.data || [];
        const newPagination = {
          currentPage: Math.max(1, parseInt(response.data.pagination?.currentPage || response.data.pagination?.page || 1)),
          totalPages: Math.max(1, parseInt(response.data.pagination?.totalPages || 1)),
          totalPets: Math.max(0, parseInt(response.data.pagination?.totalPets || response.data.pagination?.total || 0)),
          hasNext: Boolean(response.data.pagination?.hasNext),
          hasPrev: Boolean(response.data.pagination?.hasPrev),
          total: Math.max(0, parseInt(response.data.pagination?.total || response.data.pagination?.totalPets || 0))
        };
        const newFilterCounts = response.data.filterCounts || {};
        const searchDuration = Date.now() - searchStartTime;

        // Check again before updating state
        if (!currentRequest.cancelled) {
          setLoading(false);
          setError(null);
          setResults(newResults);
          setPagination(newPagination);
          setFilterCounts(newFilterCounts);
          setLastSearchTime(searchDuration);

          console.log(`✅ Filter search completed in ${searchDuration}ms`);
        }
        return true;
      } else {
        throw new Error(response.data?.message || "Search failed");
      }
    } catch (err) {
      console.error("❌ Filter search error:", err);
      
      // Only update state if request wasn't cancelled
      if (!currentRequest.cancelled) {
        setLoading(false);
        setError(err.message);
        setResults([]);
        setPagination(defaultPagination);
        setFilterCounts({});
      }
      return false;
    }
  }, []);

  // ✅ Debounced search with cancellation cleanup
  const debouncedSearchRef = useRef(null);
  
  useEffect(() => {
    debouncedSearchRef.current = debounce((searchFilters) => {
      setLoading(true);
      executeSearch(searchFilters);
    }, 300);
    
    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel();
      }
    };
  }, [executeSearch]);

  // ✅ Trigger search when stable query changes
  useEffect(() => {
    if (debouncedSearchRef.current) {
      console.log("🔍 Triggering search due to filter change:", filters);
      debouncedSearchRef.current(filters);
    }
    
    // Cleanup function to cancel requests
    return () => {
      if (cancelRef.current) {
        cancelRef.current.cancelled = true;
      }
    };
  }, [stableQuery, filters]); // Use stable query for memoization

  // ✅ Stable action creators
  const setFilter = useCallback((key, value) => {
    dispatch({ type: "SET_FILTER", key, value });
  }, []);

  const setMultipleFilters = useCallback((newFilters) => {
    dispatch({ type: "SET_MULTIPLE_FILTERS", filters: newFilters });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: "CLEAR_FILTERS" });
  }, []);

  const setPage = useCallback((page) => {
    const validPage = Math.max(1, parseInt(page) || 1);
    dispatch({ type: "SET_PAGE", page: validPage });
  }, []);

  const setSort = useCallback((sort) => {
    dispatch({ type: "SET_SORT", sort });
  }, []);

  // ✅ Computed values
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    return (
      key !== "page" &&
      key !== "limit" &&
      key !== "sort" &&
      value &&
      value !== "all" &&
      value !== ""
    );
  }).length;

  return {
    filters,
    results,
    loading,
    error,
    pagination,
    filterCounts,
    activeFilterCount,
    lastSearchTime,
    setFilter,
    setMultipleFilters,
    clearFilters,
    setPage,
    setSort,
    hasResults: results.length > 0,
    hasFilters: activeFilterCount > 0,
    canLoadMore: pagination.hasNext,
    totalResults: pagination.total || 0
  };
};