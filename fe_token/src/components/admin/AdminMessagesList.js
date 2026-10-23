// src/components/admin/AdminMessagesList.js
//
// Flagged-senders table: a sender who has sent more than 10 consecutive
// unanswered messages to the same recipient (any reply resets the streak).
// Columns: Sender (MAT/name), Recipient (MAT/name), Unanswered Count, Last
// Message Time. Pagination driven by `total`.
//
// Response shape (from FEAT-001): data:{rows,total,page,limit}; each row has
// sender_id, sender_mat, sender_name, receiver_id, recipient_mat,
// recipient_name, unanswered_count, last_message_time.

import React, { useCallback, useEffect, useState } from 'react';
import adminApi from './adminApi';
import '../../assets/css/pages/admin.css';

const LIMIT = 20;

const fmtTime = (t) => {
  if (!t) return '';
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? String(t) : d.toLocaleString();
};

const AdminMessagesList = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.get('/adminhub/messageslist', {
        params: { page, limit: LIMIT },
      });
      if (data.status === 'Success') {
        setRows(data.data.rows || []);
        setTotal(data.data.total || 0);
      } else {
        setError(data.result || 'Failed to load flagged senders.');
      }
    } catch (err) {
      setError('Failed to load flagged senders.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <h1 className="adm-page-title">Flagged Senders</h1>
      <p className="adm-page-sub">
        Senders with more than 10 consecutive unanswered messages to the same recipient.
      </p>

      {error && <div className="adm-alert">{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table adm-table--md">
          <thead>
            <tr>
              <th>Sender</th>
              <th>Recipient</th>
              <th>Unanswered Count</th>
              <th>Last Message Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="adm-table__state" colSpan={4}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="adm-table__state" colSpan={4}>No flagged senders.</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.sender_id}-${r.receiver_id}-${i}`}>
                  <td>
                    <div><strong>{r.sender_mat || `MAT${r.sender_id}`}</strong></div>
                    <span className="adm-sub">{r.sender_name}</span>
                  </td>
                  <td>
                    <div><strong>{r.recipient_mat || `MAT${r.receiver_id}`}</strong></div>
                    <span className="adm-sub">{r.recipient_name}</span>
                  </td>
                  <td><span className="adm-pill adm-pill--danger">{r.unanswered_count}</span></td>
                  <td>{fmtTime(r.last_message_time)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="adm-pager">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="adm-btn adm-btn--dark">Prev</button>
        <span className="adm-pager__info">Page {page} of {totalPages} ({total} total)</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="adm-btn adm-btn--dark">Next</button>
      </div>
    </div>
  );
};

export default AdminMessagesList;
