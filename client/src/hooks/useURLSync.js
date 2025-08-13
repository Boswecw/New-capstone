// client/src/hooks/useURLSync.js - SAFE URL SYNCHRONIZATION (FIXED)
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useURLSync = (filters, setMultipleFilters) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitialMount = useRef(true);
  const lastURLParams = useRef('');
  const lastFilters = useRef('');

  // ✅ Read URL params on mount ONLY
  useEffect(() => {
    if (!isInitialMount.current) return;
    
    const urlFilters = {};
    let hasValidFilters = false;

    // Parse URL params into filter object
    for (const [key, value] of searchParams.entries()) {
      if (value && value !== 'all' && value !== '') {
        urlFilters[key] = value;
        hasValidFilters = true;
      }
    }

    // Only apply URL filters if they're different from defaults and we have valid ones
    if (hasValidFilters) {
      const urlParamsString = searchParams.toString();
      if (urlParamsString !== lastURLParams.current) {
        console.log('🔗 Applying URL filters on mount:', urlFilters);
        setMultipleFilters(urlFilters);
        lastURLParams.current = urlParamsString;
      }
    }

    isInitialMount.current = false;
  }, [searchParams, setMultipleFilters]); // Only run when these change

  // ✅ Write filters to URL (with loop prevention)
  useEffect(() => {
    if (isInitialMount.current) return; // Don't write on initial mount

    const filtersString = JSON.stringify(filters);
    
    // Skip if filters haven't actually changed
    if (lastFilters.current === filtersString) return;
    
    lastFilters.current = filtersString;

    // Build URL params from current filters
    const newParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      // Skip default/empty values and internal params
      if (
        key !== 'page' && // Don't persist page in URL 
        key !== 'limit' &&
        value && 
        value !== 'all' && 
        value !== '' && 
        value !== null && 
        value !== false
      ) {
        newParams.set(key, value.toString());
      }
    });

    const newParamsString = newParams.toString();
    
    // Only update URL if params actually changed
    if (newParamsString !== lastURLParams.current) {
      console.log('🔗 Updating URL params:', newParamsString || '(cleared)');
      setSearchParams(newParams);
      lastURLParams.current = newParamsString;
    }
  }, [filters, setSearchParams]);
};