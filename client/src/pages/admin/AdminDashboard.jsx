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
    document.title = 'Executive Dashboard | Sriyas Healthcare Admin';
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
      setError(err.response?.data?.message || 'Unable to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }, [range, startDate, endDate]);

  useEffect(() => {
    if (range !== 'custom') {
      loadDashboard(range);
    }
  }, [range, loadDashboard]);

  const handleRangeChange = (nextRange) => {
    setRange(nextRange);
  };

  const hasData = overview && (overview.totalPageViews > 0 || overview.totalVisitors > 0 || overview.productViews > 0 || overview.totalEnquiries > 0);

  return (
    <div className="fade-in-up">
      <div className="admin-page-header">
        <div>
          <h1>Executive Analytics &amp; Operations Overview</h1>
          <p>
            Real-time, persistent metrics from MongoDB Atlas across visitors, product engagements, and customer enquiries.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/admin/enquiries" className="adm-btn adm-btn-secondary">
            ✉ Customer Enquiries {overview?.newEnquiries > 0 && <span className="adm-badge adm-badge-warning" style={{ marginLeft: '4px' }}>{overview.newEnquiries}</span>}
          </Link>
          <Link to="/admin/products/add" className="adm-btn adm-btn-primary">
            + Add Product
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
          <div className="state-title">Loading Dashboard Metrics from MongoDB...</div>
        </div>
      )}

      {error && (
        <div className="admin-card" style={{ borderColor: 'var(--status-danger)', marginBottom: '24px' }}>
          <p style={{ color: 'var(--status-danger)', fontWeight: 600 }}>{error}</p>
          <button
            type="button"
            className="adm-btn adm-btn-primary adm-btn-sm"
            style={{ marginTop: '10px' }}
            onClick={() => loadDashboard(range)}
          >
            Retry Connection
          </button>
        </div>
      )}

      {overview && (
        <>
          {/* Mandatory Executive 8-KPI Grid */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Total Visitors</span>
                <span className="admin-stat-icon">👥</span>
              </div>
              <div className="admin-stat-value">{overview.totalVisitors || 0}</div>
              <div className="admin-stat-sub">Across all browsing sessions</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Unique Visitors</span>
                <span className="admin-stat-icon">👤</span>
              </div>
              <div className="admin-stat-value" style={{ color: 'var(--gold-deep)' }}>
                {overview.uniqueVisitors || 0}
              </div>
              <div className="admin-stat-sub">Distinct anonymous client devices</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Total Page Views</span>
                <span className="admin-stat-icon">📄</span>
              </div>
              <div className="admin-stat-value">{overview.totalPageViews || 0}</div>
              <div className="admin-stat-sub">Customer page navigations</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Product Views</span>
                <span className="admin-stat-icon">👁️</span>
              </div>
              <div className="admin-stat-value" style={{ color: 'var(--gold-deep)' }}>
                {overview.productViews || 0}
              </div>
              <div className="admin-stat-sub">Detailed catalogue item impressions</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Total Enquiries</span>
                <span className="admin-stat-icon">✉️</span>
              </div>
              <div className="admin-stat-value" style={{ color: 'var(--status-success)' }}>
                {overview.totalEnquiries || 0}
              </div>
              <div className="admin-stat-sub">Contact &amp; product requests</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">New Enquiries</span>
                <span className="admin-stat-icon">🔔</span>
              </div>
              <div className="admin-stat-value" style={{ color: overview.newEnquiries > 0 ? 'var(--status-warning)' : 'inherit' }}>
                {overview.newEnquiries || 0}
              </div>
              <div className="admin-stat-sub">Awaiting team response</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Returning Visitors</span>
                <span className="admin-stat-icon">🔄</span>
              </div>
              <div className="admin-stat-value">{overview.returningVisitors || 0}</div>
              <div className="admin-stat-sub">Repeat visitors browsing catalog</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Enquiry Conversion</span>
                <span className="admin-stat-icon">🎯</span>
              </div>
              <div className="admin-stat-value" style={{ color: 'var(--gold-dark)' }}>
                {overview.conversionRate || 0}%
              </div>
              <div className="admin-stat-sub">Enquiries per visitor ratio</div>
            </div>
          </div>

          {!hasData && (
            <div className="state-container" style={{ margin: '30px 0', background: '#fff', border: '1px solid rgba(169, 130, 44, 0.2)', borderRadius: 'var(--radius-md)' }}>
              <div className="state-icon" style={{ fontSize: '2.5rem' }}>📊</div>
              <div className="state-title">No visitor data available yet</div>
              <p className="state-desc" style={{ maxWidth: '520px' }}>
                Analytics will appear as customers browse the website. All metrics are calculated live from MongoDB Atlas records without mock data.
              </p>
            </div>
          )}

          {/* Activity Trends & Top Products */}
          <div className="admin-grid-2col">
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">Visitor Traffic &amp; Page Views</h3>
                  <p className="admin-card-sub">Daily customer interactions over selected period</p>
                </div>
              </div>
              {overview.dailyTrends && overview.dailyTrends.length > 0 ? (
                <TrendLineChart
                  data={overview.dailyTrends.map(t => ({
                    label: t.label,
                    views: t.pageViews || t.visitors,
                    uniqueVisitors: t.visitors
                  }))}
                />
              ) : (
                <p className="state-desc">No trend points available for this period.</p>
              )}
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">Top Viewed Products</h3>
                  <p className="admin-card-sub">Ranking of catalogue items by customer impressions</p>
                </div>
                <Link to="/admin/analytics" className="adm-btn adm-btn-secondary adm-btn-sm">
                  View All
                </Link>
              </div>
              {overview.topProducts && overview.topProducts.length > 0 ? (
                <HorizontalBarChart
                  items={overview.topProducts.map(p => ({
                    label: p.name,
                    sub: p.brandName,
                    value: p.periodViews || p.totalViews
                  }))}
                  valueSuffix=" views"
                />
              ) : (
                <p className="state-desc">No product view events logged in this period.</p>
              )}
            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div className="admin-grid-3col" style={{ marginTop: '24px' }}>
            <Link to="/admin/visitors" className="admin-card" style={{ textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>👤</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)', fontSize: '1.25rem', marginBottom: '6px' }}>Visitor Analytics</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-mute)', margin: 0 }}>Inspect anonymous visitor profiles, visit frequency, and device types.</p>
            </Link>

            <Link to="/admin/journeys" className="admin-card" style={{ textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🧭</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)', fontSize: '1.25rem', marginBottom: '6px' }}>Visitor Journeys</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-mute)', margin: 0 }}>Follow chronological customer navigation paths across pages and surgical products.</p>
            </Link>

            <Link to="/admin/enquiries" className="admin-card" style={{ textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>✉️</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)', fontSize: '1.25rem', marginBottom: '6px' }}>Customer Enquiries</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-mute)', margin: 0 }}>Review hospital inquiries, assign statuses, add internal notes, or export to CSV.</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
