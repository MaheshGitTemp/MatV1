// src/components/admin/AdminPhotos.js
//
// Photo-review grid. Shows MAT ID, owner name, the image (rendered via the
// shared imageUrl() helper so admin and user image rendering never drift), and a
// review-status dropdown + Update (POST /adminhub/photos/status {id, status}).
// Search by MAT id; pagination driven by `total`.
//
// The initial search can be seeded from the ?search= query param (the Users page
// links here with ?search=MAT<uid>).
//
// Response shape (from FEAT-001): data:{rows,total,page,limit}; each row has
// id, matId, uid, name, imagepath, imagepath_thumb, imagepath_medium, isprofile, status.

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminApi from './adminApi';
import { imageUrl } from '../../utils/imageUrl';
import '../../assets/css/pages/admin.css';

const PHOTO_STATUSES = ['approved', 'rejected', 'pending'];
const LIMIT = 24;

const AdminPhotos = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusDraft, setStatusDraft] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.get('/adminhub/photos', {
        params: { page, limit: LIMIT, search },
      });
      if (data.status === 'Success') {
        setRows(data.data.rows || []);
        setTotal(data.data.total || 0);
      } else {
        setError(data.result || 'Failed to load photos.');
      }
    } catch (err) {
      setError('Failed to load photos.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleUpdate = async (id) => {
    const status = statusDraft[id];
    if (!status) return;
    try {
      const { data } = await adminApi.post('/adminhub/photos/status', { id, status });
      if (data.status === 'Success') {
        load();
      } else {
        alert(data.result || 'Review status update failed.');
      }
    } catch (err) {
      alert('Review status update failed.');
    }
  };

  return (
    <div>
      <h1 className="adm-page-title">Photos</h1>

      <form onSubmit={handleSearch} className="adm-toolbar">
        <div className="adm-search">
          <i className="fa-solid fa-magnifying-glass adm-search__icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by MAT id"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="adm-input adm-input--search"
          />
        </div>
        <button type="submit" className="adm-btn adm-btn--dark">Search</button>
        {search && (
          <button
            type="button"
            className="adm-btn adm-btn--ghost"
            onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
          >
            Clear
          </button>
        )}
      </form>

      {error && <div className="adm-alert">{error}</div>}

      {loading ? (
        <div className="adm-state">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="adm-state">No photos found.</div>
      ) : (
        <div className="adm-photo-grid">
          {rows.map((g) => (
            <div key={g.id} className="adm-photo-card">
              <div className="adm-photo-card__thumb">
                <img
                  src={imageUrl(g.imagepath)}
                  alt={g.matId || `MAT${g.uid}`}
                  className="adm-photo-card__img"
                />
              </div>
              <div className="adm-photo-card__meta">
                <div><strong>{g.matId || `MAT${g.uid}`}</strong>{g.isprofile ? ' • profile' : ''}</div>
                <div className="adm-muted">{g.name}</div>
                <div className="adm-muted">Status: {g.status}</div>
              </div>
              <div className="adm-photo-card__controls">
                <select
                  value={statusDraft[g.id] ?? g.status ?? 'pending'}
                  onChange={(e) => setStatusDraft((d) => ({ ...d, [g.id]: e.target.value }))}
                  className="adm-select adm-select--grow"
                >
                  {PHOTO_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button type="button" onClick={() => handleUpdate(g.id)} className="adm-btn adm-btn--dark adm-btn--sm">Update</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="adm-pager">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="adm-btn adm-btn--dark">Prev</button>
        <span className="adm-pager__info">Page {page} of {totalPages} ({total} total)</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="adm-btn adm-btn--dark">Next</button>
      </div>
    </div>
  );
};

export default AdminPhotos;
