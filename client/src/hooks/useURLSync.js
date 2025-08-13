// client/src/hooks/useURLSync.js
import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

// Only keep keys you care about in the URL
function clean(obj) {
  const out = {};
  const put = (k, v) => {
    if (v === null || v === undefined || v === '' || v === 'all') return;
    out[k] = String(v);
  };
  put('search', obj.search);
  put('category', obj.category);
  put('type', obj.type);
  put('size', obj.size);
  put('gender', obj.gender);
  put('age', obj.age);
  put('breed', obj.breed);
  if (obj.featured === true) out.featured = 'true';
  if (obj.featured === false) out.featured = 'false';
  put('status', obj.status);
  put('sort', obj.sort || 'newest');
  if (obj.page && obj.page > 1) out.page = obj.page;
  if (obj.limit && obj.limit !== 20) out.limit = obj.limit;
  return out;
}

export function useURLSync(filters, setMultipleFilters) {
  const [searchParams, setSearchParams] = useSearchParams();
  const bootstrapped = useRef(false);

  // ---- URL -> Filters (on mount and when URL truly changes)
  useEffect(() => {
    const qp = Object.fromEntries([...searchParams]);
    const next = {};

    const pick = (k) => { if (qp[k]) next[k] = qp[k]; };
    ['search','category','type','size','gender','age','breed','status','sort'].forEach(pick);

    if (qp.featured === 'true') next.featured = true;
    if (qp.featured === 'false') next.featured = false;

    const p = parseInt(qp.page, 10);
    if (!Number.isNaN(p) && p > 0) next.page = p; else next.page = 1;

    const lim = parseInt(qp.limit, 10);
    if (!Number.isNaN(lim) && lim > 0) next.limit = lim;

    // Compare shallowly to avoid loops
    const changed = Object.keys(next).some(k => next[k] !== filters[k]);
    if (changed) setMultipleFilters(next);

    bootstrapped.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ---- Filters -> URL (when filters truly change)
  const paramsFromFilters = useMemo(() => clean(filters), [filters]);

  useEffect(() => {
    if (!bootstrapped.current) return;
    const current = Object.fromEntries([...searchParams]);

    const sameLen = Object.keys(current).length === Object.keys(paramsFromFilters).length;
    const same =
      sameLen &&
      Object.keys(paramsFromFilters).every(k => String(current[k]) === String(paramsFromFilters[k]));

    if (!same) setSearchParams(paramsFromFilters, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsFromFilters]);
}
