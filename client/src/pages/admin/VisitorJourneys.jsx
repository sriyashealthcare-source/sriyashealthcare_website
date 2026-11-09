import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';

function formatTime(dt) {
  if (!dt) return '';
  try {
    return new Date(dt).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (_) {
    return String(dt);
  }
}

export default function VisitorJourneys() {
  const [journeys, setJourneys] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [visitorIdQuery, setVisitorIdQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Visitor Journeys | Sriyas Healthcare Admin';
  }, []);

  const loadJourneys = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (eventTypeFilter !== 'all') params.eventType = eventTypeFilter;
      if (visitorIdQuery.trim()) params.visitorId = visitorIdQuery.trim();
      params.limit = 60;

      const res = await analyticsService.getJourneys(params);
      setJourneys(res.journeys || []);
      setEvents(res.events || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load visitor journey traces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJourneys();
  }, [eventTypeFilter]);

  const getEventBadge = (type) => {
    switch (type) {
      case 'product_view':
        return <span className="adm-badge adm-badge-warning">Product View</span>;
      case 'brochure_download':
        return <span className="adm-badge adm-badge-danger">Brochure Download</span>;
      case 'enquiry_submit':
        return <span className="adm-badge adm-badge-success">Enquiry Submitted</span>;
      case 'category_view':
        return <span className="adm-badge adm-badge-info">Category View</span>;
      default:
        return <span className="adm-badge adm-badge-secondary">Page Navigation</span>;
    }
  };

  return (
    <div className="fade-in-up">
      <div className="admin-page-header">
        <div>
          <h1>Customer Browsing Journeys</h1>
          <p>
            Chronological step-by-step navigation trails. Follow how customers discover products and reach out for healthcare solutions.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="admin-card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
              Filter by Event Type
            </label>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="adm-input"
              style={{ minWidth: '180px', padding: '8px 12px' }}
            >
              <option value="all">All Events</option>
              <option value="page_view">Page Views Only</option>
              <option value="product_view">Product Views Only</option>
              <option value="brochure_download">Brochure Downloads</option>
              <option value="enquiry_submit">Enquiry Submissions</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
              Search by Visitor ID
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="e.g. vis_..."
                value={visitorIdQuery}
                onChange={(e) => setVisitorIdQuery(e.target.value)}
                className="adm-input"
                style={{ padding: '8px 12px' }}
              />
              <button type="button" className="adm-btn adm-btn-secondary adm-btn-sm" onClick={loadJourneys}>
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && journeys.length === 0 ? (
        <div className="state-container">
          <div className="spinner" />
          <div className="state-title">Loading Visitor Journeys...</div>
        </div>
      ) : error ? (
        <div className="admin-card" style={{ borderColor: 'var(--status-danger)' }}>
          <p style={{ color: 'var(--status-danger)', fontWeight: 600 }}>{error}</p>
          <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={loadJourneys}>
            Retry
          </button>
        </div>
      ) : journeys.length === 0 ? (
        <div className="state-container" style={{ background: '#fff', border: '1px solid rgba(169, 130, 44, 0.2)', borderRadius: 'var(--radius-md)' }}>
          <div className="state-icon" style={{ fontSize: '2.5rem' }}>🧭</div>
          <div className="state-title">No journey events recorded yet</div>
          <p className="state-desc" style={{ maxWidth: '480px' }}>
            Navigation trails will be visualized here as visitors explore different pages, view surgical products, or submit enquiries.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {journeys.map((j) => (
            <div key={j.sessionId} className="admin-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-mute)' }}>Session</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <code style={{ fontSize: '0.92rem', fontWeight: 600 }}>{j.sessionId}</code>
                    <span className="adm-badge adm-badge-info">{j.maskedVisitorId}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-mute)' }}>
                  <span>{formatTime(j.firstEventTime)}</span>
                  <span style={{ margin: '0 6px' }}>•</span>
                  <span>{j.events.length} step{j.events.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Journey Stepper Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', paddingLeft: '24px' }}>
                <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: 'rgba(169, 130, 44, 0.2)' }} />

                {j.events.map((evt, idx) => (
                  <div key={evt._id || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '-24px',
                      top: '4px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: evt.eventType === 'enquiry_submit' ? 'var(--status-success)' : evt.eventType === 'product_view' ? 'var(--gold-dark)' : 'var(--border-color)',
                      border: '2px solid #fff',
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                    }} />

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '2px' }}>
                        {getEventBadge(evt.eventType)}
                        <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.94rem' }}>
                          {evt.productNameSnapshot ? evt.productNameSnapshot : evt.pageTitle || evt.pagePath}
                        </span>
                        <code style={{ fontSize: '0.8rem', color: 'var(--text-mute)', background: '#f5f5f5', padding: '1px 6px', borderRadius: '3px' }}>
                          {evt.pagePath}
                        </code>
                      </div>
                      {evt.brandNameSnapshot && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--gold-deep)' }}>
                          Brand: {evt.brandNameSnapshot} {evt.categoryNameSnapshot && `• ${evt.categoryNameSnapshot}`}
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-mute)', whiteSpace: 'nowrap' }}>
                      {formatTime(evt.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

