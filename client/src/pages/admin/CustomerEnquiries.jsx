import React, { useState, useEffect, useCallback } from 'react';
import { enquiryService } from '../../services/enquiryService';

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

export default function CustomerEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState({ all: 0, new: 0, contacted: 0, follow_up: 0, resolved: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected enquiry for detail modal
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    document.title = 'Customer Enquiries | Sriyas Healthcare Admin';
  }, []);

  const loadEnquiries = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: pageNum,
        limit: 15,
        status: statusFilter
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await enquiryService.getEnquiries(params);
      setEnquiries(res.enquiries || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
      setPages(res.pages || 1);
      if (res.counts) setCounts(res.counts);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load customer enquiry records.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadEnquiries(page);
  }, [page, statusFilter, loadEnquiries]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadEnquiries(1);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const openEnquiryModal = async (enquiry) => {
    setSelectedEnquiry(enquiry);
    setActionSuccess('');
    setNewNote('');
    setModalLoading(true);
    try {
      const res = await enquiryService.getEnquiryById(enquiry._id);
      if (res.enquiry) setSelectedEnquiry(res.enquiry);
      setNotes(res.notes || []);
    } catch (_) {
      // Keep base enquiry
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusChange = async (enquiryId, newStatus) => {
    try {
      await enquiryService.updateStatus(enquiryId, newStatus);
      setActionSuccess(`Status updated to "${newStatus}"`);
      // Update local state
      setEnquiries(prev => prev.map(e => e._id === enquiryId ? { ...e, status: newStatus } : e));
      if (selectedEnquiry && selectedEnquiry._id === enquiryId) {
        setSelectedEnquiry(prev => ({ ...prev, status: newStatus }));
      }
      loadEnquiries(page);
    } catch (err) {
      alert('Could not update status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedEnquiry) return;
    try {
      const res = await enquiryService.addNote(selectedEnquiry._id, newNote.trim());
      if (res.note) {
        setNotes(prev => [res.note, ...prev]);
        setNewNote('');
        setActionSuccess('Internal note added successfully.');
      }
    } catch (err) {
      alert('Could not add note: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return <span className="adm-badge adm-badge-warning">🔔 New</span>;
      case 'contacted':
        return <span className="adm-badge adm-badge-info">📞 Contacted</span>;
      case 'follow_up':
        return <span className="adm-badge adm-badge-danger">⏳ Follow-up Required</span>;
      case 'resolved':
        return <span className="adm-badge adm-badge-success">✓ Resolved</span>;
      case 'closed':
        return <span className="adm-badge adm-badge-secondary">Closed</span>;
      default:
        return <span className="adm-badge adm-badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="fade-in-up">
      <div className="admin-page-header">
        <div>
          <h1>Customer Enquiry Management</h1>
          <p>
            Review and respond to hospital purchase queries, quotation requests, and medical product enquiries.
          </p>
        </div>
        <div>
          <a
            href={enquiryService.getExportCsvUrl()}
            target="_blank"
            rel="noreferrer"
            className="adm-btn adm-btn-secondary"
          >
            📥 Export Enquiries (CSV)
          </a>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="brand-tabs" style={{ marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All Enquiries', count: counts.all },
          { key: 'new', label: 'New', count: counts.new },
          { key: 'contacted', label: 'Contacted', count: counts.contacted },
          { key: 'follow_up', label: 'Follow-up', count: counts.follow_up },
          { key: 'resolved', label: 'Resolved', count: counts.resolved },
          { key: 'closed', label: 'Closed', count: counts.closed }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`brand-tab ${statusFilter === tab.key ? 'active' : ''}`}
            onClick={() => handleStatusFilterChange(tab.key)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="admin-card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Search by customer name, email, phone number, hospital or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="adm-input"
            style={{ flex: 1, padding: '10px 14px' }}
          />
          <button type="submit" className="adm-btn adm-btn-primary">
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              className="adm-btn adm-btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setPage(1);
                loadEnquiries(1);
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Table of Enquiries */}
      {loading && enquiries.length === 0 ? (
        <div className="state-container">
          <div className="spinner" />
          <div className="state-title">Loading Enquiries from Database...</div>
        </div>
      ) : error ? (
        <div className="admin-card" style={{ borderColor: 'var(--status-danger)' }}>
          <p style={{ color: 'var(--status-danger)', fontWeight: 600 }}>{error}</p>
          <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => loadEnquiries(1)}>
            Retry
          </button>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="state-container" style={{ background: '#fff', border: '1px solid rgba(169, 130, 44, 0.2)', borderRadius: 'var(--radius-md)' }}>
          <div className="state-icon" style={{ fontSize: '2.5rem' }}>✉️</div>
          <div className="state-title">No customer enquiries found</div>
          <p className="state-desc" style={{ maxWidth: '480px' }}>
            {statusFilter !== 'all'
              ? `No enquiries matching status "${statusFilter}". Try changing the filter.`
              : 'Enquiries submitted via the Contact Us page or Product detail pages will be collected and managed here.'}
          </p>
        </div>
      ) : (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Contact Info</th>
                  <th>Hospital / Company</th>
                  <th>Product of Interest</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((enq) => (
                  <tr key={enq._id} style={{ background: enq.status === 'new' ? 'rgba(212, 175, 55, 0.05)' : 'inherit' }}>
                    <td>
                      <strong>{enq.name}</strong>
                      {enq.status === 'new' && (
                        <span className="adm-badge adm-badge-warning" style={{ marginLeft: '6px', fontSize: '0.72rem' }}>
                          NEW
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.86rem' }}>
                        <a href={`tel:${enq.phone}`} style={{ color: 'var(--gold-deep)', textDecoration: 'none' }}>
                          📞 {enq.phone}
                        </a>
                        <a href={`mailto:${enq.email}`} style={{ color: 'var(--text-mute)', textDecoration: 'none' }}>
                          ✉ {enq.email}
                        </a>
                      </div>
                    </td>
                    <td>{enq.company || '—'}</td>
                    <td>
                      {enq.productOfInterest?.productName ? (
                        <strong style={{ color: 'var(--ink)' }}>{enq.productOfInterest.productName}</strong>
                      ) : (
                        <span style={{ color: 'var(--text-mute)', fontSize: '0.85rem' }}>{enq.subject || 'General Enquiry'}</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.84rem', color: 'var(--text-mute)', whiteSpace: 'nowrap' }}>
                      {formatDate(enq.createdAt)}
                    </td>
                    <td>{getStatusBadge(enq.status)}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="adm-btn adm-btn-secondary adm-btn-sm"
                        onClick={() => openEnquiryModal(enq)}
                      >
                        Inspect &amp; Manage
                      </button>
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
                Page {page} of {pages} ({total} enquiries)
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

      {/* Detailed Modal & Note Manager */}
      {selectedEnquiry && (
        <div className="modal-backdrop" onClick={() => setSelectedEnquiry(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Enquiry Details</h2>
              <button type="button" className="modal-close" onClick={() => setSelectedEnquiry(null)}>
                ✕
              </button>
            </div>

            {actionSuccess && (
              <div className="enquiry-alert enquiry-alert-success" style={{ marginBottom: '16px' }}>
                ✓ {actionSuccess}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', background: '#fdfcf9', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-mute)', fontWeight: 600 }}>Customer</span>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)' }}>{selectedEnquiry.name}</div>
                {selectedEnquiry.company && <div style={{ fontSize: '0.86rem', color: 'var(--text-mute)' }}>{selectedEnquiry.company}</div>}
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-mute)', fontWeight: 600 }}>Direct Contact</span>
                <div>
                  <a href={`tel:${selectedEnquiry.phone}`} className="adm-btn adm-btn-secondary adm-btn-sm" style={{ marginRight: '6px', marginTop: '4px' }}>
                    📞 Call {selectedEnquiry.phone}
                  </a>
                  <a href={`mailto:${selectedEnquiry.email}?subject=Re: ${encodeURIComponent(selectedEnquiry.subject || 'Sriyas Healthcare Enquiry')}`} className="adm-btn adm-btn-secondary adm-btn-sm" style={{ marginTop: '4px' }}>
                    ✉ Email
                  </a>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-mute)', fontWeight: 600 }}>Product of Interest</span>
                <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                  {selectedEnquiry.productOfInterest?.productName || 'General Enquiry'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-mute)', fontWeight: 600 }}>Submission Date</span>
                <div style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>{formatDate(selectedEnquiry.createdAt)}</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-mute)', fontWeight: 600 }}>Customer Message</span>
              <div style={{ marginTop: '6px', padding: '14px', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.94rem', lineHeight: 1.6, color: 'var(--ink)' }}>
                {selectedEnquiry.message}
              </div>
            </div>

            {/* Status Selector */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink)' }}>Update Status:</label>
              <select
                value={selectedEnquiry.status}
                onChange={(e) => handleStatusChange(selectedEnquiry._id, e.target.value)}
                className="adm-input"
                style={{ width: 'auto', padding: '6px 12px' }}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="follow_up">Follow-up Required</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Internal Notes */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '12px', color: 'var(--ink)' }}>
                Internal Team Notes
              </h4>

              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Add note (e.g. Sent catalogue quote via WhatsApp; follow up on Monday)..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="adm-input"
                  style={{ flex: 1, padding: '8px 12px' }}
                />
                <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm" disabled={!newNote.trim()}>
                  Add Note
                </button>
              </form>

              {notes.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-mute)', fontStyle: 'italic' }}>
                  No internal notes added yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {notes.map(n => (
                    <div key={n._id} style={{ background: '#f9f8f4', padding: '10px 12px', borderRadius: '6px', borderLeft: '3px solid var(--gold-dark)', fontSize: '0.86rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-mute)', fontSize: '0.78rem', marginBottom: '4px' }}>
                        <strong>{n.adminName || 'Admin'}</strong>
                        <span>{formatDate(n.createdAt)}</span>
                      </div>
                      <div style={{ color: 'var(--ink)' }}>{n.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button type="button" className="adm-btn adm-btn-secondary" onClick={() => setSelectedEnquiry(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

