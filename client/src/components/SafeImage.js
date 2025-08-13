// client/src/components/SafeImage.js - IMPROVED VERSION WITH WATCHDOG AND BETTER UX

import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

const BUCKET_BASE = "https://storage.googleapis.com/furbabies-petstore/";

function normalizeUrl(src) {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  // Support raw keys like "pet/dachshund-pup.png" or "product/leash.png"
  if (src.startsWith("pet/") || src.startsWith("product/")) {
    return BUCKET_BASE + src;
  }
  // If backend ever returns `/api/images?...` just pass it through
  if (src.startsWith("/api/images")) return src;
  // Fallback: treat as bucket key
  return BUCKET_BASE + src.replace(/^\//, "");
}

const SIZE_MAP = {
  small: { w: 120, h: 120 },
  medium: { w: 240, h: 240 },
  large: { w: 360, h: 360 },
  xl: { w: 480, h: 480 },
};

// Accept "card" from existing callers (map to medium)
function normalizeSize(size) {
  if (size === "card") return "medium";
  return SIZE_MAP[size] ? size : "medium";
}

export default function SafeImage({
  src,
  alt,
  size = "medium",
  className,
  style,
  rounded = true,
  fallback = "/images/placeholders/pet.png",
  ...imgProps
}) {
  const normalizedSrc = useMemo(() => normalizeUrl(src), [src]);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(normalizedSrc);
  const watchdogRef = useRef(null);
  const sizeKey = normalizeSize(size);
  const dims = SIZE_MAP[sizeKey];

  // Reset states when src changes
  useEffect(() => {
    setLoaded(false);
    setErrored(false);
    setCurrentSrc(normalizedSrc);
  }, [normalizedSrc]);

  // Watchdog to avoid infinite spinner (network stall, decode never firing, etc.)
  useEffect(() => {
    if (!currentSrc) return;
    clearTimeout(watchdogRef.current);
    watchdogRef.current = setTimeout(() => {
      if (!loaded && !errored) {
        // Fail closed -> show fallback
        setErrored(true);
      }
    }, 4000);
    return () => clearTimeout(watchdogRef.current);
  }, [currentSrc, loaded, errored]);

  const onLoad = () => setLoaded(true);
  const onError = () => {
    if (currentSrc !== fallback) {
      setCurrentSrc(normalizeUrl(fallback));
      setErrored(true);
      // Let fallback load (don't set loaded=true here)
    } else {
      setErrored(true);
    }
  };

  const wrapperClasses = classNames(
    "position-relative d-inline-block bg-light",
    className
  );

  const imgClasses = classNames("object-fit-cover", {
    "rounded": rounded,
  });

  const spinner =
    !loaded && !errored ? (
      <div
        className="position-absolute top-50 start-50 translate-middle"
        style={{ pointerEvents: "none" }}
        aria-hidden="true"
      >
        <div className="spinner-border text-secondary" role="status" />
      </div>
    ) : null;

  // Always render <img> so load/error can fire
  return (
    <div
      className={wrapperClasses}
      style={{
        width: dims.w,
        height: dims.h,
        overflow: "hidden",
        ...style,
      }}
    >
      {spinner}
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={alt || ""}
          width={dims.w}
          height={dims.h}
          loading="lazy"
          className={imgClasses}
          style={{
            width: "100%",
            height: "100%",
            display: loaded ? "block" : "block", // keep it in DOM so events fire
            opacity: loaded && !errored ? 1 : 0.01, // hide while spinner shows
            transition: "opacity 180ms ease",
          }}
          onLoad={onLoad}
          onError={onError}
          {...imgProps}
        />
      ) : (
        // If we have no src at all, show fallback immediately
        <img
          src={normalizeUrl(fallback)}
          alt={alt || ""}
          width={dims.w}
          height={dims.h}
          className={imgClasses}
          style={{ width: "100%", height: "100%" }}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          loading="lazy"
          {...imgProps}
        />
      )}
    </div>
  );
}

SafeImage.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.oneOf(["small", "medium", "large", "xl", "card"]),
  className: PropTypes.string,
  style: PropTypes.object,
  rounded: PropTypes.bool,
  fallback: PropTypes.string,
};