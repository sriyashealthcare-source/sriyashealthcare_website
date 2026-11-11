import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Smart link component handling in-page hash anchors, internal routes, external links,
 * and safe behavior when rendered inside Admin Homepage Preview.
 */
export default function SmartActionLink({
  to = '/products',
  className = '',
  children,
  isPreview = false,
  ariaLabel,
  id
}) {
  const target = String(to || '').trim() || '/products';

  const handleHashClick = (e) => {
    if (target.startsWith('#')) {
      e.preventDefault();
      const targetId = target.slice(1);
      if (!targetId) return;
      const scopeRoot = isPreview ? e.currentTarget.closest('.hp-preview-scroll-viewport') : document;
      const el =
        (scopeRoot && scopeRoot.querySelector(`#${CSS.escape(targetId)}`)) ||
        document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (isPreview) {
      e.preventDefault();
    }
  };

  if (target.startsWith('#')) {
    return (
      <a
        href={target}
        className={className}
        onClick={handleHashClick}
        aria-label={ariaLabel}
        id={id}
      >
        {children}
      </a>
    );
  }

  if (/^(https?:|mailto:|tel:)/i.test(target)) {
    return (
      <a
        href={target}
        className={className}
        target={/^https?:/i.test(target) ? '_blank' : undefined}
        rel={/^https?:/i.test(target) ? 'noopener noreferrer' : undefined}
        onClick={isPreview ? (e) => e.preventDefault() : undefined}
        aria-label={ariaLabel}
        id={id}
      >
        {children}
      </a>
    );
  }

  if (isPreview) {
    return (
      <a
        href={target}
        className={className}
        onClick={(e) => e.preventDefault()}
        title={`Preview link to ${target}`}
        aria-label={ariaLabel}
        id={id}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={target} className={className} aria-label={ariaLabel} id={id}>
      {children}
    </Link>
  );
}

