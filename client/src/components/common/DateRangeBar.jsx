import React from 'react';

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' }
];

export default function DateRangeBar({
  range,
  onRangeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApplyCustom
}) {
  return (
    <div className="admin-date-bar" role="region" aria-label="Date Range Filter">
      <div className="admin-date-pills">
        <span
          style={{
            fontFamily: 'var(--font-brand)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-mute)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginRight: '6px'
          }}
        >
          Period:
        </span>
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`admin-date-pill ${range === opt.value ? 'active' : ''}`}
            onClick={() => onRangeChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {range === 'custom' && (
        <div className="admin-custom-dates">
          <input
            type="date"
            aria-label="Start date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
          <span style={{ color: 'var(--text-mute)', fontSize: '0.82rem' }}>to</span>
          <input
            type="date"
            aria-label="End date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
          {onApplyCustom && (
            <button
              type="button"
              className="adm-btn adm-btn-primary adm-btn-sm"
              onClick={onApplyCustom}
            >
              Apply
            </button>
          )}
        </div>
      )}
    </div>
  );
}

