import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

export default function AdminSettings() {
  const { admin, setAdmin } = useAuth();

  const [name, setName] = useState(admin?.name || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [health, setHealth] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.title = 'Administrator Settings | Sriyas Healthcare Admin';
  }, []);

  useEffect(() => {
    if (admin) {
      setName(admin.name || '');
      setEmail(admin.email || '');
    }
  }, [admin]);

  useEffect(() => {
    authService
      .getHealthStatus()
      .then((res) => setHealth(res))
      .catch(() => {});
  }, []);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3800);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await authService.updateProfile({
        name: name.trim(),
        email: email.trim()
      });
      if (res.admin) {
        setAdmin(res.admin);
      }
      showToast(res.message || 'Profile updated successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile.', true);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match.', true);
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', true);
      return;
    }

    try {
      setSavingPassword(true);
      const res = await authService.updatePassword({
        currentPassword,
        newPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(res.message || 'Password updated successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update password.', true);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="fade-in-up">
      <div className="admin-page-header">
        <div>
          <h1>Administrator Settings</h1>
          <p>Manage your account credentials and inspect backend service health.</p>
        </div>
      </div>

      <div className="admin-two-col">
        {/* Profile Card */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Administrator Profile</h2>
          </div>

          <form onSubmit={handleProfileSubmit}>
            <div className="admin-field">
              <label htmlFor="as-name">Display Name</label>
              <input
                id="as-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="as-email">Administrator Email</label>
              <input
                id="as-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="admin-field">
              <label>Role</label>
              <input type="text" value={admin?.role || 'admin'} disabled />
            </div>

            <button
              type="submit"
              className="adm-btn adm-btn-primary"
              disabled={savingProfile}
            >
              {savingProfile ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="admin-field">
              <label htmlFor="as-cur-pwd">Current Password</label>
              <input
                id="as-cur-pwd"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="as-new-pwd">New Password (min 8 characters)</label>
              <input
                id="as-new-pwd"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="as-conf-pwd">Confirm New Password</label>
              <input
                id="as-conf-pwd"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="adm-btn adm-btn-primary"
              disabled={savingPassword}
            >
              {savingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* System Status Card */}
      {health && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Backend &amp; Cloud Integration Status</h2>
          </div>
          <div className="admin-form-grid">
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-mute)', marginBottom: '4px' }}>
                Database Mode
              </div>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                {health.database?.mode === 'mongodb-atlas'
                  ? `Connected to MongoDB Atlas (${health.database.host})`
                  : 'Local Persistent Development Store (Set MONGODB_URI in .env for MongoDB Atlas)'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-mute)', marginBottom: '4px' }}>
                Cloudinary Media Storage
              </div>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                {health.cloudinaryConfigured
                  ? 'Connected to Cloudinary Cloud Storage'
                  : 'Local Asset Storage Active (Set CLOUDINARY_* keys in .env for Cloud Storage)'}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`admin-toast ${toast.isError ? 'error' : ''}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  );
}

