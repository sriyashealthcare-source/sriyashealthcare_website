import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import DateRangeBar from '../../components/common/DateRangeBar';
import { HorizontalBarChart } from '../../components/admin/AnalyticsCharts';

export default function TrafficSources() {
  const [range, setRange] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trafficData, setTrafficData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Traffic Sources | Sriyas Healthcare Admin';
  }, []);

  const loadTraffic = async (selectedRange = range) => {
    try {
      setLoading(true);
      setError('');
      const params = { range: selectedRange };
      if (selectedRange === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const res = await analyticsService.getTrafficSources(params);
      setTrafficData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load traffic source analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (range !== 'custom') {
      loadTraffic(range);
    }
  }, [range]);

  const hasData = trafficData && trafficData.totalSessions > 0;

  return (
    <div className="fade-in-up">
      <div className="admin-page-header">
        <div>
          <h1>Traffic Sources &amp; Acquisition</h1>
          <p>
            Understand how customers and healthcare professionals discover Sriyas Healthcare through search, referrals, campaigns, and direct navigation.
          </p>
        </div>
      </div>

      <DateRangeBar
        range={range}
        onRangeChange={setRange}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApplyCustom={() => loadTraffic('custom')}
      />

      {loading && !trafficData ? (
        <div className="state-container">
          <div className="spinner" />
          <div className="state-title">Loading Traffic Sources...</div>
        </div>
      ) : error ? (
        <div className="admin-card" style={{ borderColor: 'var(--status-danger)' }}>
          <p style={{ color: 'var(--status-danger)', fontWeight: 600 }}>{error}</p>
          <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => loadTraffic(range)}>
            Retry
          </button>
        </div>
      ) : !hasData ? (
        <div className="state-container" style={{ background: '#fff', border: '1px solid rgba(169, 130, 44, 0.2)', borderRadius: 'var(--radius-md)' }}>
          <div className="state-icon" style={{ fontSize: '2.5rem' }}>🌐</div>
          <div className="state-title">No traffic records in this period</div>
          <p className="state-desc" style={{ maxWidth: '480px' }}>
            As visitors arrive from Google, social media, partner links, or campaigns, traffic channels and UTM parameters will populate here.
          </p>
        </div>
      ) : (
        <>
          {/* Traffic Channels Breakdown */}
          <div className="admin-grid-2col" style={{ marginBottom: '24px' }}>
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">Traffic Channel Distribution</h3>
                  <p className="admin-card-sub">Categorized by referrer and marketing parameters</p>
                </div>
              </div>

              <HorizontalBarChart
                items={trafficData.sources.map(s => ({
                  label: s.label,
                  sub: `${s.percentage}% of total traffic`,
                  value: s.visitors
                }))}
                valueSuffix=" sessions"
              />
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">Channel Breakdown Table</h3>
                  <p className="admin-card-sub">Session volume and percentage share</p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Source Channel</th>
                      <th>Sessions</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trafficData.sources.map((src) => (
                      <tr key={src.source}>
                        <td>
                          <strong>{src.label}</strong>
                        </td>
                        <td>{src.visitors}</td>
                        <td>
                          <span className="adm-badge adm-badge-info">{src.percentage}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Referrers & Top Landing Pages */}
          <div className="admin-grid-2col">
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">Top Referring Domains</h3>
                  <p className="admin-card-sub">Websites delivering traffic to Sriyas Healthcare</p>
                </div>
              </div>

              {trafficData.topReferrers && trafficData.topReferrers.length > 0 ? (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Domain / Source</th>
                        <th style={{ textAlign: 'right' }}>Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trafficData.topReferrers.map((r, i) => (
                        <tr key={i}>
                          <td>
                            <code>{r.referrer}</code>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="state-desc">No external referrers recorded yet.</p>
              )}
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">Top Landing Pages</h3>
                  <p className="admin-card-sub">First entry page for new visitor sessions</p>
                </div>
              </div>

              {trafficData.topLandingPages && trafficData.topLandingPages.length > 0 ? (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Page Path</th>
                        <th style={{ textAlign: 'right' }}>Entries</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trafficData.topLandingPages.map((lp, i) => (
                        <tr key={i}>
                          <td>
                            <code style={{ color: 'var(--gold-deep)' }}>{lp.page}</code>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{lp.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="state-desc">No landing page entries recorded yet.</p>
              )}
            </div>
          </div>

          {/* Marketing Campaigns (UTM) */}
          {trafficData.campaigns && trafficData.campaigns.length > 0 && (
            <div className="admin-card" style={{ marginTop: '24px' }}>
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">Active Marketing Campaigns (UTM)</h3>
                  <p className="admin-card-sub">Tracked campaigns with utm_campaign query parameters</p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Campaign Name</th>
                      <th style={{ textAlign: 'right' }}>Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trafficData.campaigns.map((c, i) => (
                      <tr key={i}>
                        <td>
                          <strong>{c.campaign}</strong>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{c.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

