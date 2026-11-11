import React, { useState, useEffect } from 'react';
import { resolveAssetUrl } from '../../utils/session';

/**
 * Renders responsive homepage imagery with optional mobile-specific image source,
 * configurable focal point (objectPosition), aspect ratio, and graceful broken-image fallback.
 */
export default function ResponsiveMediaImage({
  media = {},
  alt = '',
  className = '',
  loading = 'lazy',
  fetchPriority,
  forceMobile = false,
  fallback = null,
  style = {}
}) {
  const [hasError, setHasError] = useState(false);

  const desktopUrl = media?.url ? resolveAssetUrl(media.url) : '';
  const mobileUrl = media?.mobileUrl ? resolveAssetUrl(media.mobileUrl) : '';
  const effectiveSrc = forceMobile && mobileUrl ? mobileUrl : desktopUrl || mobileUrl;

  useEffect(() => {
    setHasError(false);
  }, [desktopUrl, mobileUrl, forceMobile]);

  if (!effectiveSrc || hasError) {
    return fallback;
  }

  const focalPoint = media?.focalPoint || 'center center';
  const ratio =
    media?.aspectRatio && media.aspectRatio !== 'auto' ? media.aspectRatio : undefined;

  const imgStyle = {
    objectPosition: focalPoint,
    ...(ratio ? { aspectRatio: ratio } : {}),
    ...style
  };

  if (!forceMobile && mobileUrl && desktopUrl && mobileUrl !== desktopUrl) {
    return (
      <picture className="hp-responsive-picture">
        <source media="(max-width: 768px)" srcSet={mobileUrl} />
        <img
          src={desktopUrl}
          alt={media?.alt || alt}
          className={className}
          style={imgStyle}
          loading={loading}
          fetchPriority={fetchPriority}
          onError={() => setHasError(true)}
        />
      </picture>
    );
  }

  return (
    <img
      src={effectiveSrc}
      alt={media?.alt || alt}
      className={className}
      style={imgStyle}
      loading={loading}
      fetchPriority={fetchPriority}
      onError={() => setHasError(true)}
    />
  );
}

