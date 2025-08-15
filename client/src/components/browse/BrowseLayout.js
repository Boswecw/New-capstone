// client/src/components/browse/BrowseLayout.js - FULLY CORRECTED VERSION

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import BrowseHeader from './BrowseHeader';
import FilterSidebar from './FilterSidebar';
import BrowseResults from './BrowseResults';
import LoadingSpinner from '../LoadingSpinner';

const BrowseLayout = ({ 
  entityConfig, 
  apiService,
  ItemCard,
  useInfiniteScroll = false,
  itemsPerPage = 12
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const triggerRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});

  const [pageCounter, setPageCounter] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [filters, setFilters] = useState(() => {
    const initialFilters = {};
    Object.keys(entityConfig.filters).forEach(key => {
      initialFilters[key] = searchParams.get(key) || 'all';
    });
    initialFilters.search = searchParams.get('search') || '';
    return initialFilters;
  });

  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);

  const handleFilterReset = useCallback(() => {
    const resetFilters = {};
    Object.keys(entityConfig.filters).forEach(key => {
      resetFilters[key] = 'all';
    });
    resetFilters.search = '';

    setFilters(resetFilters);
    setCurrentPage(1);
    if (useInfiniteScroll) {
      setPageCounter(1);
      setHasMore(true);
    }
    navigate(entityConfig.routes.browse, { replace: true });
  }, [navigate, entityConfig, useInfiniteScroll]);

  const updateURL = useCallback((newFilters, page = 1) => {
    const params = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value);
      }
    });

    if (page > 1) {
      params.set('page', page.toString());
    }

    const newURL = params.toString() 
      ? `${entityConfig.routes.browse}?${params.toString()}` 
      : entityConfig.routes.browse;
    navigate(newURL, { replace: true });
  }, [navigate, entityConfig.routes.browse]);

  const handleFilterChange = useCallback((filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);

    if (useInfiniteScroll) {
      setPageCounter(1);
      setItems([]);
      setHasMore(true);
    } else {
      setCurrentPage(1);
    }

    updateURL(newFilters, 1);
  }, [filters, updateURL, useInfiniteScroll]);

  const handleSearch = useCallback((searchTerm) => {
    handleFilterChange('search', searchTerm);
  }, [handleFilterChange]);

  const handleItemClick = useCallback((itemId) => {
    const detailRoute = entityConfig.routes.detail.replace(':id', itemId);
    navigate(detailRoute);
  }, [navigate, entityConfig.routes.detail]);

  const handleQuickAction = useCallback((actionObj) => {
    if (!actionObj || typeof actionObj !== 'object') return;

    const { action, filters: actionFilters = {} } = actionObj;

    if (action === 'reset') {
      handleFilterReset();
      return;
    }

    const newFilters = { ...filters, ...actionFilters };

    if (useInfiniteScroll) {
      setPageCounter(1);
      setItems([]);
      setHasMore(true);
    } else {
      setCurrentPage(1);
    }

    setFilters(newFilters);
    updateURL(newFilters, 1);
  }, [filters, handleFilterReset, updateURL, useInfiniteScroll]);

  const fetchData = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) {
        setInitialLoading(true);
        setError(null);
      } else {
        setLoading(true);
      }

      const queryParams = {
        page,
        limit: itemsPerPage,
        ...filters
      };

      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === 'all' || queryParams[key] === '') {
          delete queryParams[key];
        }
      });

      const response = await apiService[entityConfig.api.getAllMethod](queryParams);

      if (response?.data?.success) {
        const newItems = response.data.data || [];
        const newPagination = response.data.pagination || {};
        const newStats = response.data.stats || {};

        if (append) {
          setItems(prevItems => [...prevItems, ...newItems]);
        } else {
          setItems(newItems);
        }

        setPagination(newPagination);
        setStats(newStats);

        if (useInfiniteScroll) {
          setHasMore(newItems.length === itemsPerPage);
        }
      } else {
        throw new Error(`Failed to fetch ${entityConfig.displayName.toLowerCase()}`);
      }

    } catch (err) {
      setError(`Failed to load ${entityConfig.displayName.toLowerCase()}. Please try again.`);
      if (!append) {
        setItems([]);
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [filters, itemsPerPage, apiService, entityConfig, useInfiniteScroll]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !useInfiniteScroll) return;

    const nextPage = pageCounter + 1;
    setPageCounter(nextPage);
    await fetchData(nextPage, true);
  }, [hasMore, loading, pageCounter, fetchData, useInfiniteScroll]);

  useEffect(() => {
    const newFilters = {};
    Object.keys(entityConfig.filters).forEach(key => {
      newFilters[key] = searchParams.get(key) || 'all';
    });
    newFilters.search = searchParams.get('search') || '';

    setFilters(newFilters);

    if (!useInfiniteScroll) {
      setCurrentPage(parseInt(searchParams.get('page')) || 1);
    }
  }, [searchParams, entityConfig.filters, useInfiniteScroll]);

  useEffect(() => {
    if (useInfiniteScroll) {
      setItems([]);
      setPageCounter(1);
      setHasMore(true);
      fetchData(1, false);
    } else {
      fetchData(currentPage, false);
    }
  }, [fetchData, currentPage, useInfiniteScroll]);

  useEffect(() => {
    if (!useInfiniteScroll) return;

    const currentTrigger = triggerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading && !initialLoading) {
          loadMore();
        }
      },
      { threshold: 1.0, rootMargin: '100px' }
    );

    if (currentTrigger) {
      observer.observe(currentTrigger);
    }

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
      observer.disconnect();
    };
  }, [hasMore, loading, initialLoading, loadMore, useInfiniteScroll]);

  if (initialLoading) {
    return <LoadingSpinner message={`Finding ${entityConfig.displayName.toLowerCase()}...`} />;
  }

  return (
    <Container className="py-4">
      <BrowseHeader
        config={entityConfig.header}
        filters={filters}
        totalCount={pagination.total || items.length}
        onReset={handleFilterReset}
        onQuickAction={handleQuickAction}
      />

      <Row>
        <Col lg={3} className="mb-4">
          <FilterSidebar
            config={entityConfig.filters}
            filters={filters}
            stats={stats}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
          />
        </Col>

        <Col lg={9}>
          <BrowseResults
            items={items}
            ItemCard={ItemCard}
            entityConfig={entityConfig}
            pagination={pagination}
            currentPage={currentPage}
            loading={loading}
            error={error}
            useInfiniteScroll={useInfiniteScroll}
            hasMore={hasMore}
            triggerRef={triggerRef}
            onItemClick={handleItemClick}
            onPageChange={(page) => {
              setCurrentPage(page);
              updateURL(filters, page);
            }}
            onRetry={() => fetchData(currentPage, false)}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default BrowseLayout;
