// src/components/admin/AdminDashboard.js
//
// Four stat-card widgets (Total Profiles, Pending Users Approval, Pending Photo
// Approval, Flagged Senders) plus the four accompanying lists, all fed by a
// single GET /adminhub/dashboard call. The pending-approval cards are the
// "main thing" the user asked for (message 12).
//
// Response shape (from FEAT-001):
//   data: {
//     stats: { totalUsers, pendingProfiles, pendingPhotos, flaggedSenders },
//     pendingProfilesList, pendingPhotosList, recentUsersList, flaggedSendersList
//   }

import React, { useEffect, useState } from 'react';
import adminApi from './adminApi';
import '../../assets/css/pages/admin.css';

const ListPanel = ({ title, rows, columns, emptyText }) => (
  <div className="adm-panel">
    <h3 className="adm-panel__title">{title}</h3>
    {(!rows || rows.length === 0) ? (
      <p className="adm-state adm-state--left">{emptyText}</p>
    ) : (
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const matOf = (uid) => (uid != null ? `MAT${uid}` : '');

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await adminApi.get('/adminhub/dashboard');
        if (!active) return;
        if (res.data.status === 'Success') {
          setData(res.data.data);
        } else {
          setError(res.data.result || 'Failed to load dashboard.');
        }
      } catch (err) {
        if (active) setError('Failed to load dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  if (loading) return <div className="adm-state">Loading dashboard…</div>;
  if (error) return <div className="adm-alert">{error}</div>;
  if (!data) return null;

  const stats = data.stats || {};

  return (
    <div>
      <h1 className="adm-page-title">Dashboard</h1>

      <div className="adm-kpis">
        <div className="adm-kpi adm-kpi--total">
          <span className="adm-kpi__icon"><i className="fa-solid fa-users" aria-hidden="true" /></span>
          <div>
            <div className="adm-kpi__label">Total Profiles</div>
            <div className="adm-kpi__value">{stats.totalUsers ?? 0}</div>
          </div>
        </div>
        <div className="adm-kpi adm-kpi--pending">
          <span className="adm-kpi__icon"><i className="fa-solid fa-user-clock" aria-hidden="true" /></span>
          <div>
            <div className="adm-kpi__label">Pending Users Approval</div>
            <div className="adm-kpi__value">{stats.pendingProfiles ?? 0}</div>
          </div>
        </div>
        <div className="adm-kpi adm-kpi--photo">
          <span className="adm-kpi__icon"><i className="fa-solid fa-images" aria-hidden="true" /></span>
          <div>
            <div className="adm-kpi__label">Pending Photo Approval</div>
            <div className="adm-kpi__value">{stats.pendingPhotos ?? 0}</div>
          </div>
        </div>
        <div className="adm-kpi adm-kpi--flag">
          <span className="adm-kpi__icon"><i className="fa-solid fa-flag" aria-hidden="true" /></span>
          <div>
            <div className="adm-kpi__label">Flagged Senders</div>
            <div className="adm-kpi__value">{stats.flaggedSenders ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="adm-panels">
        <ListPanel
          title="Recent Profiles"
          rows={data.recentUsersList}
          emptyText="No profiles."
          columns={[
            { key: 'matId', label: 'MAT ID', render: (r) => r.matId || matOf(r.uid) },
            { key: 'name', label: 'Name' },
            { key: 'status', label: 'Status' },
          ]}
        />
        <ListPanel
          title="Profiles Waiting for Approval"
          rows={data.pendingProfilesList}
          emptyText="No profiles awaiting approval."
          columns={[
            { key: 'matId', label: 'MAT ID', render: (r) => r.matId || matOf(r.uid) },
            { key: 'name', label: 'Name' },
            { key: 'uemail', label: 'Email' },
          ]}
        />
        <ListPanel
          title="Photos Waiting for Review"
          rows={data.pendingPhotosList}
          emptyText="No photos awaiting review."
          columns={[
            { key: 'matId', label: 'MAT ID', render: (r) => r.matId || matOf(r.uid) },
            { key: 'name', label: 'Name' },
            { key: 'status', label: 'Status' },
          ]}
        />
        <ListPanel
          title="Flagged Senders"
          rows={data.flaggedSendersList}
          emptyText="No flagged senders."
          columns={[
            { key: 'sender_mat', label: 'Sender', render: (r) => r.sender_mat || matOf(r.sender_id) },
            { key: 'recipient_mat', label: 'Recipient', render: (r) => r.recipient_mat || matOf(r.receiver_id) },
            { key: 'unanswered_count', label: 'Unanswered' },
          ]}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
