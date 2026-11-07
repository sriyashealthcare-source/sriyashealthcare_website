import React, { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../../services/analyticsService';
import DateRangeBar from '../../components/common/DateRangeBar';
import { TrendLineChart, HorizontalBarChart } from '../../components/admin/AnalyticsCharts';
import { resolveAssetUrl } from '../../utils/session';

function formatDateTime(dt) {
  if (!dt) return 'Never viewed';
  try {
    return new Date(dt).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return String(dt);
  }
}

export default function ProductAnalytics() {
  const [range, setRange] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [granularity, setGranularity] = useState('daily');

  const [overview, setOverview] = useState(null);
  const [productsData, setProductsData] = useState({ products: [], mostViewed: [], leastViewed: [] });
  const [brandsData, setBrandsData] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [trendsData, setTrendsData] = useState({ daily: [], weekly: [], monthly: [] });
  const [recentViews, setRecentViews] = useState([]);

  // Performance Table Filters
  const [tableSearch, setTableSearch] = useState('');
  const [tableBrand, setTableBrand] = useState('');
  const [tableCategory, setTableCategory] = useState('');
  const [tableSort, setTableSort] = useState('views-desc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Product View Analytics | Sriyas Healthcare Admin';
  }, []);

  const loadAnalytics = useCallback(async (selectedRange = range) => {
    try {
      setLoading(true);
      setError('');
      const params = { range: selectedRange };
      if (selectedRange === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const [ovRes, prRes, brRes, catRes, trRes, rvRes] = await Promise.all([
        analyticsService.getOverview(params),
        analyticsService.getProductsAnalytics({ ...params, sort: tableSort }),
        analyticsService.getBrandsAnalytics(params),
        analyticsService.getCategoriesAnalytics(params),
        analyticsService.getTrends({ ...params, granularity }),
        analyticsService.getRecentViews({ ...params, limit: 15 })
      ]);

      setOverview(ovRes.overview || null);
      setProductsData({
        products: prRes.products || [],
        mostViewed: prRes.mostViewed || [],
        leastViewed: prRes.leastViewed || []
      });
      setBrandsData(brRes.brands || []);
      setCategoriesData(catRes.categories || []);
      setTrendsData({
        daily: trRes.daily || [],
        weekly: trRes.weekly || [],
        monthly: trRes.monthly || []
      });
      setRecentViews(rvRes.recentViews || []);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load product analytics.'
      );
    } finally {
      setLoading(false);
    }
  }, [range, startDate, endDate, tableSort, granularity]);

  useEffect(() => {
    if (range !== 'custom') {
      loadAnalytics(range);
    }
  }, [range]);

  // Client-side filter & sort on the Product Performance Table for instant responsiveness
  const filteredPerformanceRows = React.useMemo(() => {
    let rows = [...(productsData.products || [])];

    if (tableBrand) {
      rows = rows.filter(r => r.brandName === tableBrand || r.brandSlug === tableBrand);
    }
    if (tableCategory) {
      rows = rows.filter(r => r.categoryName === tableCategory || r.categorySlug === tableCategory);
    }
    if (tableSearch.trim()) {
      const q = tableSearch.trim().toLowerCase();
      rows = rows.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.brandName.toLowerCase().includes(q) ||
          r.categoryName.toLowerCase().includes(q)
      );
    }

    if (tableSort === 'views-asc') {
      rows.sort((a, b) => a.totalViews - b.totalViews || a.name.localeCompare(b.name));
    } else if (tableSort === 'recent') {
      rows.sort((a, b) => {
        const ta = a.lastViewedAt ? new Date(a.lastViewedAt).getTime() : 0;
        const tb = b.lastViewedAt ? new Date(b.lastViewedAt).getTime() : 0;
        return tb - ta;
      });
    } else if (tableSort === 'name') {
      rows.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      rows.sort(
        (a, b) =>
          b.totalViews - a.totalViews ||
          b.allTimeViews - a.allTimeViews ||
          a.name.localeCompare(b.name)
      );
    }

    return rows;
  }, [productsData.products, tableBrand, tableCategory, tableSearch, tableSort]);

  const activeTrendSeries =
    granularity === 'weekly'
      ? trendsData.weekly
      : granularity === 'monthly'
      ? trendsData.monthly
      : trendsData.daily;

  return (
    <div className="fade-in-up">
      <div className="admin-page-header">
        <div>
          <h1>Customer Product-View Analytics</h1>
          <p>
            Monitor which products, brands, and surgical categories customers view on the public
            Sriyas Healthcare website.
          </p>
        </div>
        <button
          type="button"
          className="adm-btn adm-btn-secondary"
          onClick={() => loadAnalytics(range)}
        >
          ↻ Refresh Analytics
        </button>
      </div>

      <DateRangeBar
        range={range}
        onRangeChange={(next) => setRange(next)}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApplyCustom={() => loadAnalytics('custom')}
      />

      {loading && !overview && (
        <div className="state-container">
          <div className="spinner" />
          <div className="state-title">Aggregating Product-View Analytics...</div>
        </div>
      )}

      {error && (
        <div className="admin-card" style={{ borderColor: 'var(--status-danger)' }}>
          <p style={{ color: 'var(--status-danger)', fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {overview && (
        <>
          {/* Summary KPI Row */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Views in Selected Period</span>
                <span className="admin-stat-icon">👁️</span>
              </div>
              <div className="admin-stat-value" style={{ color: 'var(--gold-deep)' }}>
                {overview.totalViews}
              </div>
              <div className="admin-stat-sub">
                Across {overview.uniqueSessions} unique visitor session(s)
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Cumulative All-Time Views</span>
                <span className="admin-stat-icon">📊</span>
              </div>
              <div className="admin-stat-value">{overview.allTimeViews}</div>
              <div className="admin-stat-sub">Total historical product page opens</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Most Viewed Product</span>
                <span className="admin-stat-icon">🏆</span>
              </div>
              <div className="admin-stat-value" style={{ fontSize: '1.25rem', marginTop: '4px' }}>
                {overview.mostViewedProduct ? overview.mostViewedProduct.name : '—'}
              </div>
              <div className="admin-stat-sub">
                {overview.mostViewedProduct
                  ? `${overview.mostViewedProduct.periodViews} views · ${overview.mostViewedProduct.brandName}`
                  : 'No views yet'}
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Least Viewed Product</span>
                <span className="admin-stat-icon">📉</span>
              </div>
              <div className="admin-stat-value" style={{ fontSize: '1.25rem', marginTop: '4px' }}>
                {overview.leastViewedProduct ? overview.leastViewedProduct.name : '—'}
              </div>
              <div className="admin-stat-sub">
                {overview.leastViewedProduct
                  ? `${overview.leastViewedProduct.periodViews} views · ${overview.leastViewedProduct.brandName}`
                  : 'No views yet'}
              </div>
            </div>
          </div>

          {/* Trend Line Chart with Daily / Weekly / Monthly Granularity */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Product-View Trends Over Time</h2>
              <div className="admin-date-pills">
                {[
                  { id: 'daily', label: 'Daily Trend' },
                  { id: 'weekly', label: 'Weekly Trend' },
                  { id: 'monthly', label: 'Monthly Trend' }
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`admin-date-pill ${granularity === g.id ? 'active' : ''}`}
                    onClick={() => setGranularity(g.id)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <TrendLineChart data={activeTrendSeries} height={250} />
          </div>

          {/* Most Viewed vs Least Viewed Products & Brand / Category Breakdown */}
          <div className="admin-two-col">
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Most Viewed Products</h2>
              </div>
              <HorizontalBarChart
                items={(productsData.mostViewed || []).slice(0, 7)}
                labelKey="name"
                valueKey="totalViews"
                subKey="brandName"
              />
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Views by Partner Brand</h2>
              </div>
              <HorizontalBarChart
                items={brandsData}
                labelKey="brandName"
                valueKey="totalViews"
              />
            </div>
          </div>

          <div className="admin-two-col">
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Views by Product Category</h2>
              </div>
              <HorizontalBarChart
                items={categoriesData.slice(0, 8)}
                labelKey="categoryName"
                valueKey="totalViews"
                subKey="brandName"
              />
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Least Viewed Products</h2>
              </div>
              <HorizontalBarChart
                items={(productsData.leastViewed || []).slice(0, 7)}
                labelKey="name"
                valueKey="totalViews"
                subKey="brandName"
              />
            </div>
          </div>

          {/* Product Performance Table */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">
                Product Performance Ranking Table ({filteredPerformanceRows.length})
              </h2>
            </div>

            <div className="admin-filters-row">
              <input
                type="search"
                className="admin-search-input"
                placeholder="Search product performance table..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                aria-label="Search product performance table"
              />

              <select
                className="admin-select"
                value={tableBrand}
                onChange={(e) => setTableBrand(e.target.value)}
                aria-label="Filter performance by brand"
              >
                <option value="">All Brands</option>
                {brandsData.map((b) => (
                  <option key={b._id || b.brandName} value={b.brandName}>
                    {b.brandName}
                  </option>
                ))}
              </select>

              <select
                className="admin-select"
                value={tableCategory}
                onChange={(e) => setTableCategory(e.target.value)}
                aria-label="Filter performance by category"
              >
                <option value="">All Categories</option>
                {categoriesData.map((c) => (
                  <option key={c._id || c.categoryName} value={c.categoryName}>
                    {c.categoryName}
                  </option>
                ))}
              </select>

              <select
                className="admin-select"
                value={tableSort}
                onChange={(e) => setTableSort(e.target.value)}
                aria-label="Sort performance table"
              >
                <option value="views-desc">Sort: Total Views (High → Low)</option>
                <option value="views-asc">Sort: Total Views (Low → High)</option>
                <option value="recent">Sort: Recently Viewed</option>
                <option value="name">Sort: Product Name (A–Z)</option>
              </select>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Product</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        setTableSort(tableSort === 'views-desc' ? 'views-asc' : 'views-desc')
                      }
                    >
                      Total Views {tableSort === 'views-asc' ? '↑' : '↓'}
                    </th>
                    <th>Unique Sessions</th>
                    <th>Last Viewed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPerformanceRows.map((row, idx) => (
                    <tr key={row._id || idx}>
                      <td style={{ fontWeight: 600, color: 'var(--text-mute)' }}>#{idx + 1}</td>
                      <td>
                        <div className="admin-prod-cell">
                          {row.primaryImage && (
                            <img
                              src={resolveAssetUrl(row.primaryImage)}
                              alt={row.name}
                              className="admin-prod-thumb"
                              loading="lazy"
                            />
                          )}
                          <div>
                            <div className="admin-prod-name">{row.name}</div>
                            {!row.isActive && (
                              <span className="status-badge inactive" style={{ marginTop: '2px' }}>
                                {row.isArchived ? 'Archived' : 'Inactive'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{row.brandName}</td>
                      <td>{row.categoryName}</td>
                      <td>
                        <strong style={{ fontSize: '0.96rem', color: 'var(--ink)' }}>
                          {row.totalViews}
                        </strong>
                        {row.allTimeViews !== row.totalViews && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-mute)',
                              marginLeft: '6px'
                            }}
                          >
                            ({row.allTimeViews} all-time)
                          </span>
                        )}
                      </td>
                      <td>{row.uniqueVisitors || 0}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-mute)' }}>
                        {formatDateTime(row.lastViewedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Views Activity Stream */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Recent Customer Product-View Log</h2>
            </div>

            {recentViews.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-mute)' }}>
                No product views recorded in this date window yet.
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Brand</th>
                      <th>Category</th>
                      <th>Anonymous Session</th>
                      <th>Source</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentViews.map((rv, idx) => (
                      <tr key={rv._id || idx}>
                        <td style={{ fontWeight: 600 }}>{rv.productName}</td>
                        <td>{rv.brandName}</td>
                        <td>{rv.categoryName}</td>
                        <td>
                          <code style={{ fontSize: '0.75rem', color: 'var(--text-mute)' }}>
                            {rv.visitorSessionId}
                          </code>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-mute)' }}>
                          {rv.source || 'direct'}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-mute)' }}>
                          {formatDateTime(rv.viewedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

