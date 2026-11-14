import React from 'react';

export default function GlobalSearchBar({
  value = '',
  onChange,
  onClear,
  onSubmit,
  placeholder = 'Search products, categories or manufacturers...',
  isLoading = false,
  id = 'global-product-search',
  ariaLabel = 'Search products, categories or manufacturers',
  className = ''
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit(value);
    }
  };

  return (
    <div className={`sh-search-bar-wrap ${className}`}>
      <div className="sh-search-bar-inner">
        <span className="sh-search-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6.25" stroke="currentColor" strokeWidth="1.75" />
            <path
              d="M13.75 13.75L18 18"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </span>

        <input
          id={id}
          type="search"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="sh-search-input"
        />

        {isLoading && (
          <span className="sh-search-spinner" aria-label="Searching products">
            <span className="sh-search-spinner-dot" />
          </span>
        )}

        {Boolean(value) && !isLoading && (
          <button
            type="button"
            className="sh-search-clear-btn"
            onClick={onClear}
            aria-label="Clear search query"
            title="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M3 3l8 8M11 3l-8 8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

