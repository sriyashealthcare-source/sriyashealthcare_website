import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';

function formatDate(dt) {
  if (!dt) return '—';
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

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Visitors | Sriyas Healthcare Admin';
  }, []);

  const loadVisitors = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError('');
      const res = await analyticsService.getVisitors({ page: pageNum, limit: 20 });
      setVisitors(res.visitors || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
      setPages(res.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load visitor records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitors(page);
  }, [page]);

  return (
    <div className="fade-in-up">
      <div className="admin-page-header">
        <div>
          <h1>Anonymous Visitor Analytics</h1>
          <p>
            First-party, privacy-conscious visitor profiles. All identifiers are pseudonymous without capturing customer PII or raw IP addresses.
          </p>
        </div>
        <div>
          <span className="adm-badge adm-badge-info" style={{ fontSize: '0.88rem', padding: '6px 14px' }}>
            Total Recorded Visitors: {total}
          </span>
        </div>
      </div>

      {loading && visitors.length === 0 ? (
        <div className="state-container">
          <div className="spinner" />
          <div className="state-title">Loading Visitor Data...</div>
        </div>
      ) : error ? (
        <div className="admin-card" style={{ borderColor: 'var(--status-danger)' }}>
          <p style={{ color: 'var(--status-danger)', fontWeight: 600 }}>{error}</p>
          <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => loadVisitors(1)}>
            Retry
          </button>
        </div>
      ) : visitors.length === 0 ? (
        <div className="state-container" style={{ background: '#fff', border: '1px solid rgba(169, 130, 44, 0.2)', borderRadius: 'var(--radius-md)' }}>
          <div className="state-icon" style={{ fontSize: '2.5rem' }}>👤</div>
          <div className="state-title">No visitor records yet</div>
          <p className="state-desc" style={{ maxWidth: '480px' }}>
            As customers browse the public website, privacy-safe anonymous profiles will be populated here automatically.
          </p>
        </div>
      ) : (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Masked Visitor ID</th>
                  <th>First Seen</th>
                  <th>Last Active</th>
                  <th>Sessions</th>
                  <th>Pages Viewed</th>
                  <th>Device / Browser</th>
                  <th>Referrer</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map(v => (
                  <tr key={v._id || v.visitorId}>
                    <td>
                      <code style={{ background: 'rgba(169, 130, 44, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>
                        {v.maskedVisitorId || v.visitorId}
                      </code>
                    </td>
                    <td>{formatDate(v.firstVisitAt)}</td>
                    <td>{formatDate(v.lastVisitAt)}</td>
                    <td>
                      <span className="adm-badge adm-badge-secondary">{v.sessionCount || 1}</span>
                    </td>
                    <td>
                      <strong>{v.totalPageViews || 1}</strong>
                      {v.totalProductViews > 0 && <span style={{ color: 'var(--gold-deep)', fontSize: '0.8rem', marginLeft: '6px' }}>({v.totalProductViews} products)</span>}
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>{v.deviceCategory || 'Desktop'}</span>
                      <span style={{ color: 'var(--text-mute)', fontSize: '0.8rem', marginLeft: '6px' }}>({v.browser || 'Browser'})</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-mute)' }}>
                        {v.initialReferrer || 'Direct'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="adm-btn adm-btn-secondary adm-btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-mute)' }}>
                Page {page} of {pages}
              </span>
              <button
                type="button"
                className="adm-btn adm-btn-secondary adm-btn-sm"
                disabled={page >= pages}
                onClick={() => setPage(p => Math.min(pages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

