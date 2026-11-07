import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

// Customer Pages
import Home from './pages/customer/Home';
import Products from './pages/customer/Products';
import ProductDetails from './pages/customer/ProductDetails';
import Contact from './pages/customer/Contact';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManagement from './pages/admin/ProductManagement';
import AddProduct from './pages/admin/AddProduct';
import EditProduct from './pages/admin/EditProduct';
import BrandCategoryManagement from './pages/admin/BrandCategoryManagement';
import ProductAnalytics from './pages/admin/ProductAnalytics';
import AdminSettings from './pages/admin/AdminSettings';

function NotFoundPage() {
  return (
    <div className="state-container" style={{ minHeight: '75vh' }}>
      <div className="eyebrow">404 Error</div>
      <h1 className="state-title" style={{ fontSize: '2.2rem' }}>
        Page Not Found
      </h1>
      <p className="state-desc">
        The page you requested does not exist or may have been moved.
      </p>
      <Link to="/" className="hero-cta">
        Return to Homepage
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Customer Interface */}
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetails />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Separate Administrator Interface */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="products/add" element={<AddProduct />} />
            <Route path="products/edit/:id" element={<EditProduct />} />
            <Route path="brands-categories" element={<BrandCategoryManagement />} />
            <Route path="analytics" element={<ProductAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

