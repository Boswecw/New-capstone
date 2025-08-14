// client/src/hooks/usePetFilters.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { petAPI } from '../services/api';
import { buildImageUrl, getFallbackUrl } from '../utils/imageBuilder';

// Map URL params -> initial filters
function parseInitialFilters(search) {
  const params = new URLSearchParams(search);
  const filters = {
    search: params.get('search') || '',
    type: params.get('type') || 'all',
    size: params.get('size') || 'all',
    gender: params.get('gender') || 'all',
    age: params.get('age') || 'all',
    sort: params.get('sort') || 'newest',
    // booleans
    featured: params.get('featured') === 'true' ? true : undefined,
    available:
      params.get('status') === 'adopted'
        ? false
        : params.get('status') === 'all'
          ? undefined
          : true, // default "available"
  };
  return filters;
}

// Build API params from filters
function toApiParams(filters, page, limit) {
  const p = { page, limit, sort: filters.sort || 'newest' };

  if (filters.search) p.search = filters.search;
  if (filters.type && filters.type !== 'all') p.type = filters.type;
  if (filters.size && filters.size !== 'all') p.size = filters.size;
  if (filters.gender && filters.gender !== 'all') p.gender = filters.gender;
  if (filters.age && filters.age !== 'all') p.age = filters.age;
  if (typeof filters.available === 'boolean') p.available = filters.available;
  if (typeof filters.featured === 'boolean') p.featured = filters.featured;

  return p;
}

// Ensure every pet has a usable imageUrl client-side
function normalizePetImage(pet) {
  // Respect server-enriched URLs if present
  if (pet?.imageUrl && (pet.imageUrl.startsWith('http://') || pet.imageUrl.startsWith('https://'))) {
    return { ...pet };
  }

  const path =
    pet?.image ||
    pet?.imagePath ||
    pet?.photo ||
    pet?.picture ||
    (Array.isArray(pet?.images) && pet.images[0]) ||
    (Array.isArray(pet?.photos) && pet.photos[0]) ||
    null;

  const entityType = pet?.type || 'pet';
  const category = pet?.category;

  const computed = buildImageUrl(path, { entityType, category });
  return {
    ...pet,
    imageUrl: computed || getFallbackUrl(entityType, category),
    // keep original if present so PetCard's src chain also works
    imagePath: pet?.imagePath || pet?.image || null,
  };
}

export function usePetFilters() {
  const location = useLocation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState(() => parseInitialFilters(location.search));
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, limit: 12 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Keep page/limit internal; reset page=1 on filter/sort changes
  const pageRef = useRef(1);
  const limitRef = useRef(12);

  const hasResults = results.length > 0;

  // URL sync (optional, keeps parity with products)
  const syncUrl = useCallback(
    (nextFilters) => {
      const params = new URLSearchParams();

      if (nextFilters.search) params.set('search', nextFilters.search);
      if (nextFilters.type && nextFilters.type !== 'all') params.set('type', nextFilters.type);
      if (nextFilters.size && nextFilters.size !== 'all') params.set('size', nextFilters.size);
      if (nextFilters.gender && nextFilters.gender !== 'all') params.set('gender', nextFilters.gender);
      if (nextFilters.age && nextFilters.age !== 'all') params.set('age', nextFilters.age);
      if (nextFilters.sort && nextFilters.sort !== 'newest') params.set('sort', nextFilters.sort);
      if (typeof nextFilters.featured === 'boolean') params.set('featured', String(nextFilters.featured));

      // status for human-readable URL: available/adopted/all
      if (typeof nextFilters.available === 'boolean') {
        params.set('status', nextFilters.available ? 'available' : 'adopted');
      } else {
        params.set('status', 'all');
      }

      navigate({ pathname: '/browse', search: params.toString() }, { replace: true });
    },
    [navigate],
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count += 1;
    if (filters.type && filters.type !== 'all') count += 1;
    if (filters.size && filters.size !== 'all') count += 1;
    if (filters.gender && filters.gender !== 'all') count += 1;
    if (filters.age && filters.age !== 'all') count += 1;
    if (typeof filters.available === 'boolean') count += 1;
    if (typeof filters.featured === 'boolean') count += 1;
    return count;
  }, [filters]);

  const fetchPets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = toApiParams(filters, pageRef.current, limitRef.current);
      // If your server supports it, you can also pass a hint:
      // params.withImage = true;

      const res = await petAPI.getAllPets(params);
      const payload = res?.data || {};

      const list = Array.isArray(payload.data) ? payload.data : [];
      const normalized = list.map(normalizePetImage);

      setResults(normalized);

      // Support both your new pagination and legacy
      const p = payload.pagination || {};
      const total = typeof p.total === 'number' ? p.total : normalized.length;

      setTotalResults(total);
      setPagination({
        currentPage: Number(p.page || pageRef.current),
        totalPages: Number(p.pages || Math.ceil(total / limitRef.current) || 1),
        limit: Number(p.limit || limitRef.current),
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('usePetFilters fetch error:', e);
      setError('Unable to load pets. Please try again.');
      setResults([]);
      setTotalResults(0);
      setPagination({ currentPage: 1, totalPages: 1, limit: limitRef.current });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial + when filters change -> reset page and fetch
  useEffect(() => {
    pageRef.current = 1;
    fetchPets();
    syncUrl(filters);
  }, [filters, fetchPets, syncUrl]);

  // Public API expected by Browse.js
  const setFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      // normalizations
      if (key === 'featured' && typeof value !== 'boolean') next.featured = undefined;
      if (key === 'available' && typeof value !== 'boolean') next.available = undefined;
      return next;
    });
  }, []);

  const setSort = useCallback((sort) => {
    setFilters((prev) => ({ ...prev, sort: sort || 'newest' }));
  }, []);

  const setPage = useCallback((pageNum) => {
    pageRef.current = Number(pageNum) || 1;
    fetchPets();
  }, [fetchPets]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      type: 'all',
      size: 'all',
      gender: 'all',
      age: 'all',
      sort: 'newest',
      available: true, // default like products list
      featured: undefined,
    });
  }, []);

  const refetch = useCallback(() => {
    fetchPets();
  }, [fetchPets]);

  return {
    results,
    loading,
    error,
    pagination,
    totalResults,
    hasResults,
    filters,
    activeFiltersCount,
    setFilter,
    setSort,
    setPage,
    clearFilters,
    refetch,
  };
}
