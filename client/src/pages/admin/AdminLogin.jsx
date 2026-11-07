import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const { isAuthenticated, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Administrator Login | Sriyas Healthcare Pvt Ltd';
  }, []);

  if (!loading && isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || '/admin/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your administrator email and password.');
      return;
    }

    try {
      setSubmitting(true);
      await login(email.trim(), password);
      const redirectTo = location.state?.from?.pathname || '/admin/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Authentication failed. Please check your email and password.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <img src="/assets/logos/sriyas-emblem.png" alt="Sriyas Healthcare emblem" />
          <div>
            <span className="admin-login-badge">Administrator Portal</span>
          </div>
          <h1>Sriyas Healthcare</h1>
          <p>Sign in to manage products, brands, and customer analytics.</p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: 'var(--status-danger-bg)',
              color: 'var(--status-danger)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '18px',
              fontSize: '0.86rem',
              fontWeight: 500
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-field">
            <label htmlFor="admin-email">Email Address</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sriyashealthcare.com"
              required
            />
          </div>

          <div className="admin-field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter administrator password"
              required
            />
          </div>

          <button
            type="submit"
            className="adm-btn adm-btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            disabled={submitting}
          >
            {submitting ? 'Signing In...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="admin-login-footer">
          <Link to="/">← Return to Public Customer Website</Link>
        </div>
      </div>
    </div>
  );
}

