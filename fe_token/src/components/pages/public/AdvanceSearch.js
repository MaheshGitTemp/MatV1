

// src/components/pages/public/AdvanceSearch.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Profiles from '../../templates/ImagesLoader';
import { fetchUserDetails } from '../../../services/userService';
import '../../../assets/css/pages/advance-search.css';

const AdvanceSearch = () => {
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanId = searchId.trim().replace(/^MAT/i, '').trim();

    if (!cleanId) {
      setErrorMsg('Please enter a MAT ID to search.');
      return;
    }
    if (isNaN(cleanId)) {
      setErrorMsg('Please enter a valid numeric MAT ID. Example: MAT123 or 123');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchUserDetails(cleanId);
      if (res.data && res.data.uid) {
        navigate(`/profiledetails/${cleanId}`);
      } else {
        setErrorMsg(`No profile found for MAT${cleanId}. Please check the ID and try again.`);
      }
    } catch {
      setErrorMsg(`No profile found for MAT${cleanId}. Please check the ID and try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Page Heading */}
      <div
        className="inner-heading"
        style={{ backgroundImage: `url(${Profiles.titlebg})` }}
      >
        <div className="container">
          <h3>Advanced Search</h3>
        </div>
      </div>

      <div className="inner-content">
        <div className="container">

          {/* ── Search Card ────────────────────────────────────────────── */}
          <div className="adv-card">

            {/* Card Header */}
            <div className="adv-card__head">
              <div className="adv-card__icon">
                <i className="fas fa-search" aria-hidden="true"></i>
              </div>
              <div>
                <h4 className="adv-card__title">
                  Search by MAT ID
                </h4>
                <p className="adv-card__sub">
                  Find any profile instantly using their unique matrimony ID
                </p>
              </div>
            </div>

            {/* Card Body */}
            <div className="adv-card__body">
              <form onSubmit={handleSearch}>

                {/* Label */}
                <label className="adv-label" htmlFor="adv-mat-id">
                  Enter MAT ID
                  <span className="adv-required">*</span>
                </label>

                {/* Input + Button Row */}
                <div className="adv-row">
                  {/* Input wrapper with MAT prefix */}
                  <div className="adv-input-wrap">
                    {/* MAT prefix badge */}
                    <div className="adv-prefix" aria-hidden="true">
                      <span>MAT</span>
                    </div>

                    <input
                      id="adv-mat-id"
                      type="text"
                      placeholder="e.g.  123"
                      value={searchId}
                      onChange={(e) => {
                        setSearchId(e.target.value);
                        setErrorMsg('');
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e); }}
                      className={`adv-input${errorMsg ? ' is-error' : ''}`}
                      aria-invalid={!!errorMsg}
                      onFocus={e => {
                        if (!errorMsg) e.target.style.borderColor = '#a84040';
                      }}
                      onBlur={e => {
                        if (!errorMsg) e.target.style.borderColor = '#dee2e6';
                      }}
                    />
                  </div>

                  {/* Search Button — same height as input */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`adv-submit${loading ? ' is-loading' : ''}`}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Searching...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-search"></i>
                        Search
                      </>
                    )}
                  </button>
                </div>

                {/* Helper text */}
                <p className="adv-help">
                  You can type <strong>123</strong> or <strong>MAT123</strong> — both work
                </p>

                {/* Error Message */}
                {errorMsg && (
                  <div className="adv-error" role="alert">
                    <i className="fas fa-times-circle" aria-hidden="true"></i>
                    {errorMsg}
                  </div>
                )}

              </form>

              {/* Divider */}
              <div className="adv-divider" />

              {/* Tips section */}
              <div>
                <p className="adv-tips__title">
                  How to find a MAT ID
                </p>
                <div className="adv-tips__list">
                  {[
                    { icon: 'fa-id-card',  color: '#a84040', text: 'MAT ID is shown on every profile page e.g. MAT144' },
                    { icon: 'fa-share-alt', color: '#8B0000', text: 'Ask the person to share their MAT ID from their dashboard' },
                    { icon: 'fa-bell',      color: '#FF9800', text: 'MAT ID appears in your proposal and notification history' }
                  ].map((tip, i) => (
                    <div key={i} className="adv-tip">
                      <div className="adv-tip__icon" style={{ background: tip.color }}>
                        <i className={`fas ${tip.icon}`} aria-hidden="true"></i>
                      </div>
                      <span className="adv-tip__text">{tip.text}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AdvanceSearch;
