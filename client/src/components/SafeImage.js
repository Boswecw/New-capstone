import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import imageBuilder from '../utils/imageBuilder';

const { buildImageUrl, getFallbackUrl } = imageBuilder;

const SafeImage = ({
  src,
  item,
  entityType,
  category,
  cacheKey,
  alt,
  className,
  style,
  imgProps = {},     // <-- only this object will be spread onto <img>
  showLoader = true,
  showErrorMessage = false,
  onLoad,
  onError,
}) => {
  const inferredType = entityType || item?.type || (category ? 'product' : 'default');
  const inferredCategory = category || item?.category || null;
  const derivedCacheKey =
    cacheKey ??
    item?.updatedAt?.$date ??
    item?.updatedAt ??
    item?._id ??
    undefined;

  const builtSrc = useMemo(() => {
    const raw = src ?? item?.image ?? item?.imageUrl ?? item?.imagePath ?? null;
    const url = buildImageUrl(raw, {
      entityType: inferredType,
      category: inferredCategory,
      cacheKey: derivedCacheKey,
    });
    // eslint-disable-next-line no-console
    console.debug('SafeImage →', { raw, url, inferredType, inferredCategory });
    return url;
  }, [src, item, inferredType, inferredCategory, derivedCacheKey]);

  const [currentSrc, setCurrentSrc] = useState(builtSrc);
  const [loading, setLoading] = useState(Boolean(showLoader));
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setCurrentSrc(builtSrc);
    setErrored(false);
    setLoading(Boolean(showLoader));
  }, [builtSrc, showLoader]);

  const handleLoad = useCallback((e) => {
    setLoading(false);
    onLoad?.(e);
  }, [onLoad]);

  const handleError = useCallback((e) => {
    const fallback = getFallbackUrl(inferredType, inferredCategory);
    if (currentSrc !== fallback) {
      setCurrentSrc(fallback);
      setLoading(false);
      setErrored(false);
    } else {
      setErrored(true);
      setLoading(false);
    }
    onError?.(e);
  }, [currentSrc, inferredType, inferredCategory, onError]);

  return (
    <div className={className || ''} style={style}>
      {loading && showLoader && (
        <div className="safe-image__loader">
          <div className="spinner" />
          <span>Loading...</span>
        </div>
      )}
      <img
        {...imgProps}
        src={currentSrc}
        alt={alt || 'Image'}
        onLoad={handleLoad}
        onError={handleError}
        loading={imgProps.loading || 'lazy'}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        style={{
          opacity: loading ? 0.3 : 1,
          transition: 'opacity 0.25s ease',
          ...(imgProps.style || {}),
        }}
      />
      {errored && showErrorMessage && (
        <div className="safe-image__error">
          <i className="fas fa-exclamation-triangle" /> Image unavailable
        </div>
      )}
    </div>
  );
};

SafeImage.propTypes = {
  src: PropTypes.string,
  item: PropTypes.object,
  entityType: PropTypes.string,
  category: PropTypes.string,
  cacheKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  alt: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  imgProps: PropTypes.object,
  showLoader: PropTypes.bool,
  showErrorMessage: PropTypes.bool,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
};

export default SafeImage;
