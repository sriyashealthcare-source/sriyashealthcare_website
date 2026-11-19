import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SRIYAS_EMBLEM_URL } from '../utils/cloudinaryAssets';

export default function AdminLayout() {
  const { admin, isAuthenticated, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-close sidebar drawer when navigating to another admin route
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Lock background body scroll when mobile drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  if (loading) {
    return (
      <div className="state-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <div className="state-title">Verifying Administrator Session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const handleLogout = async () => {
    setSidebarOpen(false);
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/admin/dashboard')) return 'Executive Dashboard';
    if (p.includes('/admin/visitors')) return 'Anonymous Visitor Analytics';
    if (p.includes('/admin/journeys')) return 'Customer Browsing Journeys';
    if (p.includes('/admin/enquiries')) return 'Customer Enquiry Management';
    if (p.includes('/admin/traffic-sources')) return 'Traffic Sources & Acquisition';
    if (p.includes('/admin/devices')) return 'Device & Technology Analytics';
    if (p.includes('/admin/reports')) return 'Analytics & Operational Reports';
    if (p.includes('/admin/products/add')) return 'Add New Product';
    if (p.includes('/admin/products/edit')) return 'Edit Product';
    if (p.includes('/admin/products')) return 'Product Catalogue Management';
    if (p.includes('/admin/brands-categories')) return 'Brands & Categories';
    if (p.includes('/admin/homepage-editor')) return 'Homepage Editor';
    if (p.includes('/admin/analytics')) return 'Product-Specific Analytics';
    if (p.includes('/admin/settings')) return 'Administrator Settings';
    return 'Administrator Portal';
  };

  const initials = (admin?.name || 'Admin')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-shell">
      {/* Mobile/Tablet Backdrop Overlay */}
      <div
        className={`admin-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar Navigation Drawer */}
      <aside
        className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
        aria-label="Administrator Navigation"
        id="admin-navigation-drawer"
      >
        <div className="admin-sidebar-header">
          <Link
            to="/admin/dashboard"
            className="admin-sidebar-brand"
            onClick={closeSidebar}
            title="Sriyas Healthcare Admin"
          >
            <img src={SRIYAS_EMBLEM_URL} alt="Sriyas Healthcare Emblem" />
            <div className="admin-sidebar-brand-text">
              <span className="admin-sidebar-brand-title">SRIYAS HEALTHCARE</span>
              <span className="admin-sidebar-brand-sub">Admin Console</span>
            </div>
          </Link>

          {/* Clearly visible Close (X) button for mobile/tablet drawer */}
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
            title="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section-label">Overview</div>
          <NavLink
            to="/admin/dashboard"
            onClick={closeSidebar}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">📊</span>
            <span>Dashboard</span>
          </NavLink>

          <div className="admin-nav-section-label">Analytics &amp; Intelligence</div>
          <NavLink
            to="/admin/visitors"
            onClick={closeSidebar}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">👥</span>
            <span>Visitors</span>
          </NavLink>

          <NavLink
            to="/admin/journeys"
            onClick={closeSidebar}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">🧭</span>
            <span>Visitor Journeys</span>
          </NavLink>

          <NavLink
            to="/admin/analytics"
            onClick={closeSidebar}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">📈</span>
            <span>Product Analytics</span>
          </NavLink>

          <NavLink
            to="/admin/traffic-sources"
            onClick={closeSidebar}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">🌐</span>
            <span>Traffic Sources</span>
          </NavLink>

          <NavLink
            to="/admin/devices"
            onClick={closeSidebar}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">📱</span>
            <span>Device Analytics</span>
          </NavLink>

          <NavLink
            to="/admin/reports"
            onClick={closeSidebar}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">📑</span>
            <span>Reports &amp; Export</span>
          </NavLink>

          <div className="admin-nav-section-label">Customer CRM</div>
          <NavLink
            to="/admin/enquiries"
            onClick={closeSidebar}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">✉️</span>
            <span>Customer Enquiries</span>
          </NavLink>

          <div className="admin-nav-section-label">Catalogue Management</div>
          <NavLink
            to="/admin/products"
            end
            onClick={closeSidebar}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">📦</span>
            <span>Products</span>
          </NavLink>

          <NavLink
            to="/admin/products/add"
            onClick={closeSidebar}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">➕</span>
            <span>Add Product</span>
          </NavLink>

          <NavLink
            to="/admin/brands-categories"
            onClick={closeSidebar}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">🏷️</span>
            <span>Brands &amp; Categories</span>
          </NavLink>

          <div className="admin-nav-section-label">Website Management</div>
          <NavLink
            to="/admin/homepage-editor"
            onClick={closeSidebar}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">🖥️</span>
            <span>Homepage Editor</span>
          </NavLink>

          <div className="admin-nav-section-label">System</div>
          <NavLink
            to="/admin/settings"
            onClick={closeSidebar}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">⚙️</span>
            <span>Settings</span>
          </NavLink>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="admin-nav-item"
            style={{ marginTop: '8px' }}
            onClick={closeSidebar}
          >
            <span className="admin-nav-icon">↗</span>
            <span>View Public Website</span>
          </a>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-pill">
            <div className="admin-user-avatar">{initials}</div>
            <div className="admin-user-meta">
              <div className="admin-user-name">{admin?.name || 'Administrator'}</div>
              <div className="admin-user-email">{admin?.email}</div>
            </div>
          </div>
          <button type="button" className="admin-logout-btn" onClick={handleLogout}>
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrap">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Open Navigation Menu"
              aria-expanded={sidebarOpen}
            >
              ☰
            </button>
            <span className="admin-topbar-title">{getPageTitle()}</span>
          </div>

          <div className="admin-topbar-right">
            <Link
              to="/admin/enquiries"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              style={{ marginRight: '8px' }}
            >
              ✉ Enquiries
            </Link>
            <Link to="/admin/products/add" className="adm-btn adm-btn-primary adm-btn-sm">
              + Add Product
            </Link>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
