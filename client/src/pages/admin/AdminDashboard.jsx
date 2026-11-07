import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import DateRangeBar from '../../components/common/DateRangeBar';
import { TrendLineChart, HorizontalBarChart } from '../../components/admin/AnalyticsCharts';
import { resolveAssetUrl } from '../../utils/session';

function formatDateTime(dt) {
  if (!dt) return 'Never';
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

export default function AdminDashboard() {
  const [range, setRange] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Admin Dashboard | Sriyas Healthcare Pvt Ltd';
  }, []);

  const loadDashboard = useCallback(async (selectedRange = range) => {
    try {
      setLoading(true);
      setError('');
      const params = { range: selectedRange };
      if (selectedRange === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const res = await analyticsService.getOverview(params);
      setOverview(res.overview || null);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load dashboard statistics.'
      );
    } finally {
      setLoading(false);
    }
  }, [range, startDate, endDate]);

  useEffect(() => {
    if (range !== 'custom') {
      loadDashboard(range);
    }
  }, [range]);

  const handleRangeChange = (nextRange) => {
    setRange(nextRange);
  };

  return (
    <div className="fade-in-up">
      <div className="admin-page-header">
        <div>
          <h1>Catalogue &amp; Engagement Overview</h1>
          <p>
            Real-time metrics for Sriyas Healthcare products and customer product-view activity.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/admin/analytics" className="adm-btn adm-btn-secondary">
            📈 Full Analytics Report
          </Link>
          <Link to="/admin/products/add" className="adm-btn adm-btn-primary">
            + Add New Product
          </Link>
        </div>
      </div>

      <DateRangeBar
        range={range}
        onRangeChange={handleRangeChange}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApplyCustom={() => loadDashboard('custom')}
      />

      {loading && !overview && (
        <div className="state-container">
          <div className="spinner" />
          <div className="state-title">Loading Dashboard Metrics...</div>
        </div>
      )}

      {error && (
        <div className="admin-card" style={{ borderColor: 'var(--status-danger)' }}>
          <p style={{ color: 'var(--status-danger)', fontWeight: 600 }}>{error}</p>
          <button
            type="button"
            className="adm-btn adm-btn-primary adm-btn-sm"
            style={{ marginTop: '10px' }}
            onClick={() => loadDashboard(range)}
          >
            Retry
          </button>
        </div>
      )}

      {overview && (
        <>
          {/* Summary Cards */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Total Products</span>
                <span className="admin-stat-icon">📦</span>
              </div>
              <div className="admin-stat-value">{overview.totalProducts}</div>
              <div className="admin-stat-sub">
                {overview.archivedProducts > 0
                  ? `${overview.archivedProducts} archived`
                  : 'Complete active catalogue'}
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Active Products</span>
                <span className="admin-stat-icon">✅</span>
              </div>
              <div className="admin-stat-value" style={{ color: 'var(--status-success)' }}>
                {overview.activeProducts}
              </div>
              <div className="admin-stat-sub">Visible on customer website</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Inactive Products</span>
                <span className="admin-stat-icon">⏸️</span>
              </div>
              <div className="admin-stat-value" style={{ color: 'var(--status-warning)' }}>
                {overview.inactiveProducts}
              </div>
              <div className="admin-stat-sub">Hidden from public view</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Product Views (Period)</span>
                <span className="admin-stat-icon">👁️</span>
              </div>
              <div className="admin-stat-value" style={{ color: 'var(--gold-deep)' }}>
                {overview.totalViews}
              </div>
              <div className="admin-stat-sub">
                {overview.allTimeViews} all-time views recorded
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Unique Sessions</span>
                <span className="admin-stat-icon">👥</span>
              </div>
              <div className="admin-stat-value">{overview.uniqueSessions}</div>
              <div className="admin-stat-sub">Distinct product-viewing sessions</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Most Viewed Product</span>
                <span className="admin-stat-icon">🏆</span>
              </div>
              <div
                className="admin-stat-value"
                style={{ fontSize: '1.25rem', lineHeight: 1.25, marginTop: '4px' }}
              >
                {overview.mostViewedProduct ? overview.mostViewedProduct.name : '—'}
              </div>
              <div className="admin-stat-sub">
                {overview.mostViewedProduct
                  ? `${overview.mostViewedProduct.periodViews} period views (${overview.mostViewedProduct.brandName})`
                  : 'No views yet'}
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Least Viewed Product</span>
                <span className="admin-stat-icon">📉</span>
              </div>
              <div
                className="admin-stat-value"
                style={{ fontSize: '1.25rem', lineHeight: 1.25, marginTop: '4px' }}
              >
                {overview.leastViewedProduct ? overview.leastViewedProduct.name : '—'}
              </div>
              <div className="admin-stat-sub">
                {overview.leastViewedProduct
                  ? `${overview.leastViewedProduct.periodViews} period views (${overview.leastViewedProduct.brandName})`
                  : 'No views yet'}
              </div>
            </div>
          </div>

          {/* Charts Row: Daily View Trends & Top Viewed Products */}
          <div className="admin-two-col">
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Product-View Trends</h2>
                <Link to="/admin/analytics" className="adm-btn adm-btn-secondary adm-btn-sm">
                  Detailed Trends →
                </Link>
              </div>
              <TrendLineChart data={overview.dailyTrends || []} />
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Top Viewed Products</h2>
                <Link to="/admin/analytics" className="adm-btn adm-btn-secondary adm-btn-sm">
                  All Rankings →
                </Link>
              </div>
              <HorizontalBarChart
                items={(overview.topProducts || []).slice(0, 6)}
                labelKey="name"
                valueKey="periodViews"
                subKey="brandName"
              />
            </div>
          </div>

          {/* Tables Row: Recently Viewed Products & Recently Added Products */}
          <div className="admin-two-col">
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Recently Viewed Products</h2>
                <Link to="/admin/analytics" className="adm-btn adm-btn-secondary adm-btn-sm">
                  View Activity Log
                </Link>
              </div>

              {(!overview.recentlyViewedProducts ||
                overview.recentlyViewedProducts.length === 0) ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-mute)' }}>
                  No customer product views recorded in this time window yet. Open any product on
                  the customer website to see live tracking here.
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Brand</th>
                        <th>Viewed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.recentlyViewedProducts.map((v, idx) => (
                        <tr key={v._id || idx}>
                          <td>
                            <div className="admin-prod-name">{v.productName}</div>
                            <div className="admin-prod-sub">{v.categoryName}</div>
                          </td>
                          <td>{v.brandName}</td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-mute)' }}>
                            {formatDateTime(v.viewedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Recently Added Products</h2>
                <Link to="/admin/products" className="adm-btn adm-btn-secondary adm-btn-sm">
                  Manage Catalogue
                </Link>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Brand</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(overview.recentlyAddedProducts || []).map((p) => (
                      <tr key={p._id}>
                        <td>
                          <div className="admin-prod-cell">
                            {p.primaryImage && (
                              <img
                                src={resolveAssetUrl(p.primaryImage)}
                                alt={p.name}
                                className="admin-prod-thumb"
                              />
                            )}
                            <div>
                              <div className="admin-prod-name">{p.name}</div>
                              <div className="admin-prod-sub">{p.categoryName}</div>
                            </div>
                          </div>
                        </td>
                        <td>{p.brandName}</td>
                        <td>
                          <span className={`status-badge ${p.isActive ? 'active' : 'inactive'}`}>
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/admin/products/edit/${p._id}`}
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

