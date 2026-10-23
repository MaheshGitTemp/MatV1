// src/components/admin/AdminLogin.js
//
// Admin login: two fields (identifier, password) -> POST /adminhub/login.
// On Success navigate to the dashboard. On Failure show the backend's message
// inline. This mirrors the user-login lesson (messages 5/6): a wrong password
// MUST surface a visible error and must NOT appear to log in. The backend
// returns HTTP 200 with {status:'Failure'} for wrong credentials (no interceptor
// swallows it), so we branch on data.status rather than on an HTTP error.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from './adminApi';
import '../../assets/css/pages/admin.css';
import '../../assets/css/pages/admin-login.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Enter your username/email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await adminApi.post('/adminhub/login', {
        identifier: identifier.trim(),
        password,
      });

      if (data.status === 'Success') {
        navigate('/adminhub/matrimony/dashboard', { replace: true });
      } else {
        // Wrong credentials: show the error, do NOT navigate.
        setError(data.result || 'Invalid credentials.');
      }
    } catch (err) {
      // Unexpected server/network error (e.g. 500).
      setError(err.response?.data?.result || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="adm-login">
      <form onSubmit={handleSubmit} className="adm-login__card">
        <div className="adm-login__brand">
          <span className="adm-login__icon">
            <i className="fa-solid fa-user-shield" aria-hidden="true" />
          </span>
          <h2 className="adm-login__title">Admin Login</h2>
        </div>

        {error && (
          <div role="alert" className="adm-alert">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="adm-login__field">
          <label className="adm-login__label">
            Username or Email
          </label>
          <input
            type="text"
            className="adm-input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="adm-login__field">
          <label className="adm-login__label">
            Password
          </label>
          <input
            type="password"
            className="adm-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="adm-btn adm-btn--primary adm-btn--block"
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
