// src/components/pages/private/CloseAccount.js
import React, { useState, useContext } from 'react';
import Profiles from '../../templates/ImagesLoader';
import Sidebar from './templates/Sidebar';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../hooks/AuthContext';
import { closeAccount } from '../../../services/userService';
import { useToast } from '../../../components/hooks/ToastContext';
import '../../../assets/css/pages/close-account.css';
const CloseAccount = () => {
  const navigate    = useNavigate();
  const { showToast } = useToast();

  const { logout }  = useContext(AuthContext);

  // ── State ─────────────────────────────────────────────────────────────────
  const [step,         setStep]         = useState(1); // 1=warning, 2=confirm, 3=done
  const [loading,      setLoading]      = useState(false);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [typedConfirm, setTypedConfirm] = useState('');

  // User must type "CLOSE" to confirm
  const CONFIRM_WORD = 'CLOSE';

  // ── Handle close account ──────────────────────────────────────────────────
  const handleCloseAccount = async () => {
    if (typedConfirm !== CONFIRM_WORD) {
      setErrorMsg(`Please type "${CONFIRM_WORD}" to confirm.`);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await closeAccount();

      if (res.data.status === 'Success') {
        showToast({
  title:       'Account Closing',
  description: 'Your account is being closed. You will be logged out shortly.',
  type:        'warning',
  duration:    4000
});
        setStep(3); // show success screen
        // Clear local state + cookies via logout
        await logout();
      } else {
        setErrorMsg(res.data.result || 'Failed to close account. Please try again.');
      }
    } catch (err) {
      showToast({
  title:       'Account Closing',
  description: 'Your account is being closed. You will be logged out shortly.',
  type:        'warning',
  duration:    4000
});
      console.error('closeAccount error:', err);
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  //  RENDER
  // =========================================================================
  return (
    <>
      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container">
          <h3>Close Account</h3>
        </div>
      </div>

      <div className="inner-content cla-page">
        <div className="container">
          <div className="profile-Wrap">
            <div className="row">
              <Sidebar />

              <div className="col-lg-8 col-md-8">
                <div className="cla">
                  <div className="cla-card">

                    {/* ── STEP 1: Warning ─────────────────────────────────── */}
                    {step === 1 && (
                      <>
                        <div className="cla-head">
                          <h3 className="cla-title cla-title--danger">
                            <i className="fas fa-exclamation-triangle"></i>
                            Close Your Account
                          </h3>
                        </div>

                        <div className="cla-body">
                          {/* Warning banner */}
                          <div className="cla-warning">
                            <h5>
                              ⚠️ Before you close your account, please read:
                            </h5>
                            <ul>
                              <li>Your profile will be permanently deactivated</li>
                              <li>You will not be able to login with this account</li>
                              <li>All your proposals and messages will be hidden</li>
                              <li>Your MAT ID will be reserved and not reused</li>
                              <li>To reactivate, you must contact support</li>
                            </ul>
                          </div>

                          {/* What happens */}
                          <div className="cla-section">
                            <h5 className="cla-section__title">What happens when you close:</h5>
                            <div className="cla-effects">
                              {[
                                { icon: 'fa-user-slash',    color: '#f44336', label: 'Profile Hidden',     desc: 'No longer visible in search' },
                                { icon: 'fa-lock',          color: '#FF9800', label: 'Account Locked',    desc: 'Cannot login anymore'         },
                                { icon: 'fa-heart-broken',  color: '#E91E63', label: 'Proposals Removed', desc: 'All proposals deactivated'    },
                                { icon: 'fa-envelope-open', color: '#9C27B0', label: 'Messages Hidden',   desc: 'Chat history inaccessible'    }
                              ].map((item, i) => (
                                <div key={i} className="cla-effect">
                                  <div className="cla-effect__icon" style={{ background: item.color }}>
                                    <i className={`fas ${item.icon}`} aria-hidden="true"></i>
                                  </div>
                                  <div>
                                    <div className="cla-effect__label">{item.label}</div>
                                    <div className="cla-effect__desc">{item.desc}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="cla-actions">
                            <button
                              type="button"
                              onClick={() => navigate('/dashboard')}
                              className="cla-btn cla-btn--keep"
                            >
                              <i className="fas fa-arrow-left"></i>
                              Keep My Account
                            </button>
                            <button
                              type="button"
                              onClick={() => setStep(2)}
                              className="cla-btn cla-btn--danger"
                            >
                              <i className="fas fa-times-circle"></i>
                              I Want to Close My Account
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── STEP 2: Final Confirmation ───────────────────────── */}
                    {step === 2 && (
                      <>
                        <div className="cla-head">
                          <h3 className="cla-title cla-title--danger">
                            <i className="fas fa-exclamation-circle"></i>
                            Final Confirmation
                          </h3>
                        </div>

                        <div className="cla-body">
                          {/* Danger banner */}
                          <div className="cla-danger">
                            <i className="fas fa-exclamation-triangle cla-danger__icon" aria-hidden="true"></i>
                            <h5>
                              This action cannot be undone!
                            </h5>
                            <p>
                              Your account will be permanently closed. You will be logged out immediately.
                            </p>
                          </div>

                          {/* Type to confirm */}
                          <div className="cla-confirm">
                            <label htmlFor="cla-confirm-input" className="cla-label">
                              Type <strong>{CONFIRM_WORD}</strong> to confirm account closure:
                            </label>
                            <input
                              id="cla-confirm-input"
                              type="text"
                              className={`form-control cla-input ${typedConfirm && typedConfirm !== CONFIRM_WORD ? 'is-wrong' : ''} ${typedConfirm === CONFIRM_WORD ? 'is-match' : ''}`}
                              placeholder={`Type ${CONFIRM_WORD} here`}
                              value={typedConfirm}
                              onChange={(e) => {
                                setTypedConfirm(e.target.value.toUpperCase());
                                setErrorMsg('');
                              }}
                            />
                            {/* Live feedback */}
                            {typedConfirm && (
                              <span className={`cla-feedback ${typedConfirm === CONFIRM_WORD ? 'is-ok' : 'is-bad'}`}>
                                {typedConfirm === CONFIRM_WORD
                                  ? '✅ Confirmed — you can now close your account'
                                  : `❌ Please type exactly: ${CONFIRM_WORD}`}
                              </span>
                            )}
                          </div>

                          {/* Error message */}
                          {errorMsg && (
                            <div className="cla-error" role="alert">
                              <i className="fas fa-times-circle"></i>
                              {errorMsg}
                            </div>
                          )}

                          {/* Buttons */}
                          <div className="cla-actions">
                            <button
                              type="button"
                              onClick={() => { setStep(1); setTypedConfirm(''); setErrorMsg(''); }}
                              className="cla-btn cla-btn--ghost"
                            >
                              <i className="fas fa-arrow-left"></i>
                              Go Back
                            </button>
                            <button
                              type="button"
                              onClick={handleCloseAccount}
                              disabled={loading || typedConfirm !== CONFIRM_WORD}
                              className={`cla-btn cla-btn--danger ${loading ? 'is-loading' : ''}`}
                            >
                              {loading ? (
                                <><i className="fas fa-spinner fa-spin"></i>Closing Account...</>
                              ) : (
                                <><i className="fas fa-times-circle"></i>Close My Account Permanently</>
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── STEP 3: Success / Account Closed ────────────────── */}
                    {step === 3 && (
                      <div className="cla-done">
                        <div className="cla-done__icon">
                          <i className="fas fa-check-circle" aria-hidden="true"></i>
                        </div>
                        <h4>
                          Account Closed Successfully
                        </h4>
                        <p>
                          Your account has been closed. We're sorry to see you go.<br />
                          If you change your mind, please contact our support team.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/')}
                          className="cla-btn cla-btn--keep"
                        >
                          <i className="fas fa-home"></i>
                          Go to Home
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CloseAccount;
