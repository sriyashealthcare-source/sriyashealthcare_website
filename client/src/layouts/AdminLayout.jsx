import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { admin, isAuthenticated, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/admin/dashboard')) return 'Executive Dashboard';
    if (p.includes('/admin/products/add')) return 'Add New Product';
    if (p.includes('/admin/products/edit')) return 'Edit Product';
    if (p.includes('/admin/products')) return 'Product Catalogue Management';
    if (p.includes('/admin/brands-categories')) return 'Brands & Categories';
    if (p.includes('/admin/analytics')) return 'Customer Product-View Analytics';
    if (p.includes('/admin/settings')) return 'Administrator Settings';
    return 'Administrator Portal';
  };

  const initials = (admin?.name || 'Admin')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Administrator Navigation">
        <Link to="/admin/dashboard" className="admin-sidebar-brand">
          <img src="/assets/logos/sriyas-emblem.png" alt="Sriyas Healthcare" />
          <div className="admin-sidebar-brand-text">
            <span className="admin-sidebar-brand-title">SRIYAS HEALTHCARE</span>
            <span className="admin-sidebar-brand-sub">Admin Console</span>
          </div>
        </Link>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section-label">Overview &amp; Insights</div>
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">📊</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/analytics"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">📈</span>
            <span>Product Analytics</span>
          </NavLink>

          <div className="admin-nav-section-label">Catalogue Management</div>
          <NavLink
            to="/admin/products"
            end
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">📦</span>
            <span>Products</span>
          </NavLink>

          <NavLink
            to="/admin/products/add"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">➕</span>
            <span>Add Product</span>
          </NavLink>

          <NavLink
            to="/admin/brands-categories"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">🏷️</span>
            <span>Brands &amp; Categories</span>
          </NavLink>

          <div className="admin-nav-section-label">System</div>
          <NavLink
            to="/admin/settings"
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
          >
            <span className="admin-nav-icon">🌐</span>
            <span>View Public Website ↗</span>
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
              aria-label="Toggle Menu"
            >
              ☰
            </button>
            <span className="admin-topbar-title">{getPageTitle()}</span>
          </div>

          <div className="admin-topbar-right">
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

