import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import DateRangeBar from '../../components/common/DateRangeBar';
import { HorizontalBarChart } from '../../components/admin/AnalyticsCharts';

export default function DeviceAnalytics() {
  const [range, setRange] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Device & Browser Analytics | Sriyas Healthcare Admin';
  }, []);

  const loadDevices = async (selectedRange = range) => {
    try {
      setLoading(true);
      setError('');
      const params = { range: selectedRange };
      if (selectedRange === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const res = await analyticsService.getDeviceAnalytics(params);
      setDeviceData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load device analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (range !== 'custom') {
      loadDevices(range);
    }
  }, [range]);

  const hasData = deviceData && deviceData.totalSessions > 0;

  return (
    <div className="fade-in-up">
      <div className="admin-page-header">
        <div>
          <h1>Device &amp; Technology Analytics</h1>
          <p>
            Hardware categories, browser distribution, and operating systems used by doctors, hospital administrators, and customers browsing Sriyas Healthcare.
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
        onApplyCustom={() => loadDevices('custom')}
      />

      {loading && !deviceData ? (
        <div className="state-container">
          <div className="spinner" />
          <div className="state-title">Loading Device Metrics...</div>
        </div>
      ) : error ? (
        <div className="admin-card" style={{ borderColor: 'var(--status-danger)' }}>
          <p style={{ color: 'var(--status-danger)', fontWeight: 600 }}>{error}</p>
          <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => loadDevices(range)}>
            Retry
          </button>
        </div>
      ) : !hasData ? (
        <div className="state-container" style={{ background: '#fff', border: '1px solid rgba(169, 130, 44, 0.2)', borderRadius: 'var(--radius-md)' }}>
          <div className="state-icon" style={{ fontSize: '2.5rem' }}>📱</div>
          <div className="state-title">No device session data available yet</div>
          <p className="state-desc" style={{ maxWidth: '480px' }}>
            Device categories and browser tech breakdowns will be summarized here as visitors access the website.
          </p>
        </div>
      ) : (
        <>
          {/* Device Category Cards */}
          <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
            {deviceData.devices.map(dev => (
              <div key={dev.category} className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-label">{dev.category} Visitors</span>
                  <span className="admin-stat-icon">
                    {dev.category === 'Desktop' ? '💻' : dev.category === 'Mobile' ? '📱' : '📟'}
                  </span>
                </div>
                <div className="admin-stat-value">{dev.count}</div>
                <div className="admin-stat-sub">
                  <span className="adm-badge adm-badge-info">{dev.percentage}%</span> of total visitors
                </div>
              </div>
            ))}
          </div>

          {/* Browser & OS Grids */}
          <div className="admin-grid-2col">
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">Browser Distribution</h3>
                  <p className="admin-card-sub">Web browsers used to view surgical catalog</p>
                </div>
              </div>

              <HorizontalBarChart
                items={deviceData.browsers.map(b => ({
                  label: b.name,
                  sub: `${b.percentage}% share`,
                  value: b.count
                }))}
                valueSuffix=" sessions"
              />
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">Operating Systems</h3>
                  <p className="admin-card-sub">Client OS platform distribution</p>
                </div>
              </div>

              <HorizontalBarChart
                items={deviceData.operatingSystems.map(os => ({
                  label: os.name,
                  sub: `${os.percentage}% share`,
                  value: os.count
                }))}
                valueSuffix=" sessions"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

