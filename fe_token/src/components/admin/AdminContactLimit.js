// src/components/admin/AdminContactLimit.js
//
// Contact Limit Settings: lets the admin set how many contact details each user
// can view per day. The value lives in the app_settings key/value table
// (key 'daily_contact_view_limit'); enforcement reads it live, so a saved change
// takes effect immediately.
//
// GET  /adminhub/settings/contact-limit → { data:{ daily_contact_view_limit } }
// POST /adminhub/settings/contact-limit { limit } → { data:{ daily_contact_view_limit } }

import React, { useCallback, useEffect, useState } from 'react';
import adminApi from './adminApi';
import '../../assets/css/pages/admin.css';

const AdminContactLimit = () => {
  const [limit, setLimit] = useState('');
  const [savedLimit, setSavedLimit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await adminApi.get('/adminhub/settings/contact-limit');
      if (data.status === 'Success') {
        const value = data.data.daily_contact_view_limit;
        setLimit(String(value));
        setSavedLimit(value);
      } else {
        setError(data.result || 'Failed to load contact limit.');
      }
    } catch (err) {
      setError('Failed to load contact limit.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await adminApi.post('/adminhub/settings/contact-limit', {
        limit: Number(limit),
      });
      if (data.status === 'Success') {
        const value = data.data.daily_contact_view_limit;
        setLimit(String(value));
        setSavedLimit(value);
        setSuccess('Contact limit updated.');
      } else {
        setError(data.result || 'Failed to update contact limit.');
      }
    } catch (err) {
      setError('Failed to update contact limit.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="adm-page-title">Contact Limit Settings</h1>
      <p className="adm-page-sub">
        This is the number of contact details each user can view per day.
      </p>

      {error && <div className="adm-alert">{error}</div>}

      {loading ? (
        <p className="adm-page-sub">Loading…</p>
      ) : (
        <form onSubmit={handleSave} className="adm-toolbar">
          <input
            type="number"
            min={1}
            max={100}
            step={1}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="adm-input"
            aria-label="Daily contact-view limit"
            required
          />
          <button type="submit" className="adm-btn adm-btn--dark" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          {success && <span className="adm-pill adm-pill--ok">{success}</span>}
        </form>
      )}

      {!loading && savedLimit !== null && (
        <p className="adm-page-sub">
          Current limit: <strong>{savedLimit}</strong> contact{savedLimit === 1 ? '' : 's'} per day.
        </p>
      )}
    </div>
  );
};

export default AdminContactLimit;
