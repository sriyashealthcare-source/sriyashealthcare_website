import React, { useState } from 'react';

export function TrendLineChart({ data = [], height = 240 }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-mute)', fontSize: '0.88rem' }}>
        No trend data recorded for this period yet.
      </div>
    );
  }

  const width = 720;
  const padLeft = 44;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 38;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxViews = Math.max(4, ...data.map(d => Number(d.views) || 0));

  const points = data.map((d, idx) => {
    const x =
      data.length === 1
        ? padLeft + chartW / 2
        : padLeft + (idx / (data.length - 1)) * chartW;
    const y = padTop + chartH - ((Number(d.views) || 0) / maxViews) * chartH;
    return { x, y, ...d };
  });

  const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPoints =
    points.length > 0
      ? `${points[0].x.toFixed(1)},${padTop + chartH} ${polylinePoints} ${points[points.length - 1].x.toFixed(1)},${padTop + chartH}`
      : '';

  const yTicks = [0, Math.round(maxViews / 2), maxViews];

  return (
    <div className="chart-container" style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', minWidth: '460px', display: 'block' }}
        role="img"
        aria-label="Product views trend line chart"
      >
        <defs>
          <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid Lines & Y-Axis Labels */}
        {yTicks.map((tick, idx) => {
          const y = padTop + chartH - (tick / maxViews) * chartH;
          return (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="rgba(169, 130, 44, 0.16)"
                strokeDasharray="4 4"
              />
              <text
                x={padLeft - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#6B6862"
                fontFamily="Poppins, sans-serif"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Area & Line */}
        {points.length > 1 && <polygon points={areaPoints} fill="url(#goldAreaGrad)" />}
        {points.length > 1 && (
          <polyline
            fill="none"
            stroke="#A9822C"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />
        )}

        {/* Data Points & X-Axis Labels */}
        {points.map((pt, idx) => {
          const showLabel =
            data.length <= 10 || idx === 0 || idx === data.length - 1 || idx % 2 === 0;
          const isHovered = hoverIdx === idx;
          return (
            <g
              key={pt.dateKey || idx}
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : 4}
                fill={isHovered ? '#0F1210' : '#D4AF37'}
                stroke="#fff"
                strokeWidth="2"
              />
              {showLabel && (
                <text
                  x={pt.x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="10.5"
                  fill="#6B6862"
                  fontFamily="Inter, sans-serif"
                >
                  {pt.label}
                </text>
              )}
              {isHovered && (
                <g>
                  <rect
                    x={Math.min(Math.max(pt.x - 58, 4), width - 122)}
                    y={Math.max(pt.y - 44, 2)}
                    width="116"
                    height="34"
                    rx="4"
                    fill="#0F1210"
                  />
                  <text
                    x={Math.min(Math.max(pt.x, 62), width - 64)}
                    y={Math.max(pt.y - 28, 16)}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="600"
                    fill="#F0D27A"
                    fontFamily="Poppins, sans-serif"
                  >
                    {pt.label}: {pt.views} view{pt.views === 1 ? '' : 's'}
                  </text>
                  <text
                    x={Math.min(Math.max(pt.x, 62), width - 64)}
                    y={Math.max(pt.y - 15, 29)}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="#fff"
                    fontFamily="Inter, sans-serif"
                  >
                    {pt.uniqueVisitors || 0} unique session{pt.uniqueVisitors === 1 ? '' : 's'}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function HorizontalBarChart({ items = [], labelKey = 'name', valueKey = 'totalViews', subKey = '' }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-mute)', fontSize: '0.88rem' }}>
        No analytics records available.
      </div>
    );
  }

  const maxVal = Math.max(1, ...items.map(it => Number(it[valueKey]) || 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {items.map((item, idx) => {
        const val = Number(item[valueKey]) || 0;
        const pct = Math.min(100, Math.round((val / maxVal) * 100));
        return (
          <div key={item._id || item[labelKey] || idx}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink)' }}>
                {item[labelKey]}
                {subKey && item[subKey] ? (
                  <span style={{ fontWeight: 400, fontSize: '0.76rem', color: 'var(--text-mute)', marginLeft: '6px' }}>
                    ({item[subKey]})
                  </span>
                ) : null}
              </div>
              <div style={{ fontFamily: 'var(--font-brand)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gold-deep)', whiteSpace: 'nowrap' }}>
                {val} view{val === 1 ? '' : 's'}
                {item.percentage !== undefined ? ` (${item.percentage}%)` : ''}
              </div>
            </div>
            <div className="rank-bar-track">
              <div className="rank-bar-fill" style={{ width: `${val > 0 ? Math.max(pct, 4) : 0}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

