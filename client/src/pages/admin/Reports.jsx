import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { enquiryService } from '../../services/enquiryService';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Analytics & Operational Reports | Sriyas Healthcare Admin';
  }, []);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        setError('');
        const res = await analyticsService.getReports({ type: 'overview' });
        setSummary(res.summary || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load report summaries.');
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const getExportUrl = (type) => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const token = sessionStorage.getItem('sriyas_admin_token') || '';
    if (type === 'enquiries') {
      return `${baseUrl}/admin/enquiries/export?token=${encodeURIComponent(token)}`;
    }
    return `${baseUrl}/admin/analytics/reports?type=${type}&format=csv&token=${encodeURIComponent(token)}`;
  };

  return (
    <div className="fade-in-up">
      <div className="admin-page-header">
        <div>
          <h1>Analytics &amp; Operational Reports</h1>
          <p>
            Generate and export real-world data reports from MongoDB Atlas for business intelligence, inventory decisions, and sales follow-ups.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="state-container">
          <div className="spinner" />
          <div className="state-title">Loading Report Metrics...</div>
        </div>
      ) : error ? (
        <div className="admin-card" style={{ borderColor: 'var(--status-danger)' }}>
          <p style={{ color: 'var(--status-danger)', fontWeight: 600 }}>{error}</p>
        </div>
      ) : (
        <>
          {/* Data Summary Grid */}
          <div className="admin-stats-grid" style={{ marginBottom: '30px' }}>
            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Stored Products</span>
                <span className="admin-stat-icon">📦</span>
              </div>
              <div className="admin-stat-value">{summary?.totalProducts || 0}</div>
              <div className="admin-stat-sub">Catalogue items in database</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Unique Visitors</span>
                <span className="admin-stat-icon">👥</span>
              </div>
              <div className="admin-stat-value" style={{ color: 'var(--gold-deep)' }}>
                {summary?.totalVisitors || 0}
              </div>
              <div className="admin-stat-sub">Tracked client devices</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Total Sessions</span>
                <span className="admin-stat-icon">🧭</span>
              </div>
              <div className="admin-stat-value">{summary?.totalSessions || 0}</div>
              <div className="admin-stat-sub">Browsing sessions recorded</div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">Total Enquiries</span>
                <span className="admin-stat-icon">✉️</span>
              </div>
              <div className="admin-stat-value" style={{ color: 'var(--status-success)' }}>
                {summary?.totalEnquiries || 0}
              </div>
              <div className="admin-stat-sub">Submitted customer leads</div>
            </div>
          </div>

          {/* Export Report Action Cards */}
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', marginBottom: '16px', color: 'var(--ink)' }}>
            Available Export Reports (.CSV)
          </h2>

          <div className="admin-grid-3col">
            <div className="admin-card">
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '8px', color: 'var(--ink)' }}>
                Product Popularity Report
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-mute)', marginBottom: '20px', lineHeight: 1.5 }}>
                Export all products with current view counts, brand associations, categories, and last viewed timestamps.
              </p>
              <a
                href={getExportUrl('products')}
                target="_blank"
                rel="noreferrer"
                className="adm-btn adm-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                📥 Download Products CSV
              </a>
            </div>

            <div className="admin-card">
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✉️</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '8px', color: 'var(--ink)' }}>
                Customer Enquiries Report
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-mute)', marginBottom: '20px', lineHeight: 1.5 }}>
                Export all customer enquiries including contact information, hospital names, products of interest, and status.
              </p>
              <a
                href={getExportUrl('enquiries')}
                target="_blank"
                rel="noreferrer"
                className="adm-btn adm-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                📥 Download Enquiries CSV
              </a>
            </div>

            <div className="admin-card">
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🌐</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '8px', color: 'var(--ink)' }}>
                Traffic &amp; Acquisition Report
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-mute)', marginBottom: '20px', lineHeight: 1.5 }}>
                Analyze traffic channels, search queries, external referrers, and campaign performance metrics.
              </p>
              <a
                href="/admin/traffic-sources"
                className="adm-btn adm-btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                View Acquisition Trends →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

