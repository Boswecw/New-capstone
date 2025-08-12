// client/src/hooks/usePetFilters.js
import { useReducer, useEffect, useCallback, useState, useRef } from "react";
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

  // ✅ Enhanced pagination normalization
  const normalizePagination = useCallback((paginationData) => {
    if (!paginationData || typeof paginationData !== 'object') {
      return defaultPagination;
    }

    return {
      currentPage: Math.max(1, parseInt(paginationData.currentPage || paginationData.page || 1)),
      totalPages: Math.max(1, parseInt(paginationData.totalPages || 1)),
      totalPets: Math.max(0, parseInt(paginationData.totalPets || paginationData.total || 0)),
      hasNext: Boolean(paginationData.hasNext),
      hasPrev: Boolean(paginationData.hasPrev),
      total: Math.max(0, parseInt(paginationData.total || paginationData.totalPets || 0))
    };
  }, []);

  // ✅ Search function without debounce 
  const executeSearch = useCallback(async (searchFilters) => {
    const searchStartTime = Date.now();
    setLoading(true);
    setError(null);

    try {
      console.log("🔍 Executing filter search:", searchFilters);

      const response = await searchPetsWithFilters(searchFilters);

      if (response.data?.success) {
        setResults(response.data.data || []);
        
        // ✅ Normalize pagination data
        const normalizedPagination = normalizePagination(response.data.pagination);
        setPagination(normalizedPagination);
        
        setFilterCounts(response.data.filterCounts || {});
        setLastSearchTime(Date.now() - searchStartTime);
        console.log(`✅ Filter search completed in ${Date.now() - searchStartTime}ms`);
      } else {
        throw new Error(response.data?.message || "Search failed");
      }
    } catch (err) {
      console.error("❌ Filter search error:", err);
      setError(err.message);
      setResults([]);
      setPagination(defaultPagination);
      setFilterCounts({});
    } finally {
      setLoading(false);
    }
  }, [normalizePagination]);

  // ✅ Create debounced version using useRef
  const debouncedSearchRef = useRef(null);
  
  // ✅ Initialize debounced function
  useEffect(() => {
    debouncedSearchRef.current = debounce(executeSearch, 300);
    
    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel();
      }
    };
  }, [executeSearch]);

  // ✅ Trigger search when filters change
  useEffect(() => {
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current(filters);
    }
  }, [filters]);

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