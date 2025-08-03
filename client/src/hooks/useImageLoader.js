// client/src/hooks/useImageLoader.js - CUSTOM HOOK FOR IMAGE LOADING
import { useState, useEffect } from 'react';
import { validateImageUrl } from '../utils/imageUtils';

/**
 * Custom hook for robust image loading with fallback support
 * @param {string} src - Primary image source
 * @param {string} fallbackSrc - Fallback image source
 * @param {object} options - Additional options
 * @returns {object} Loading state and image source
 */
export const useImageLoader = (src, fallbackSrc = null, options = {}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const { maxRetries = 2, retryDelay = 1000 } = options;

  useEffect(() => {
    let mounted = true;
    let timeoutId = null;

    const loadImage = async () => {
      if (!src) {
        if (mounted) {
          setLoading(false);
          setError(true);
        }
        return;
      }

      setLoading(true);
      setError(false);

      try {
        // Try original source
        const isValid = await validateImageUrl(src);
        
        if (!mounted) return;

        if (isValid) {
          setImageSrc(src);
          setError(false);
        } else if (fallbackSrc) {
          // Try fallback source
          const fallbackValid = await validateImageUrl(fallbackSrc);
          if (mounted) {
            if (fallbackValid) {
              setImageSrc(fallbackSrc);
              setError(false);
            } else {
              setError(true);
            }
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.warn('Image loading error:', err);
        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const loadWithRetry = () => {
      loadImage().catch(() => {
        if (mounted && retryCount < maxRetries) {
          timeoutId = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryDelay);
        }
      });
    };

    loadWithRetry();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [src, fallbackSrc, retryCount, maxRetries, retryDelay]);

  // Reset when src changes
  useEffect(() => {
    setRetryCount(0);
    setImageSrc(src);
  }, [src]);

  const retry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
    }
  };

  return { 
    imageSrc, 
    loading, 
    error, 
    retry,
    retryCount,
    canRetry: retryCount < maxRetries
  };
};