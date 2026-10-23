
import React, { useState, useEffect } from 'react';
import Profiles from '../../templates/ImagesLoader';
import Sidebar from './templates/Sidebar';
import { changePassword, getUserContactInfo } from '../../../services/userService';
import { useToast } from '../../../components/hooks/ToastContext';
import '../../../assets/css/pages/change-password.css';
const ChangePassword = () => {
  const userId = localStorage.getItem('userId');
const { showToast } = useToast();

  // ── Form state ────────────────────────────────────────────────────────────
  const [currentPassword,     setCurrentPassword]     = useState('');
  const [newPassword,         setNewPassword]         = useState('');
  const [confirmNewPassword,  setConfirmNewPassword]  = useState('');

  // ── Eye toggle state ──────────────────────────────────────────────────────
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading,      setLoading]      = useState(false);
  const [successMsg,   setSuccessMsg]   = useState('');
  const [errorMsg,     setErrorMsg]     = useState('');
  const [errors,       setErrors]       = useState({});

  // ── User info (read-only display) ─────────────────────────────────────────
  const [userEmail,    setUserEmail]    = useState('');
  const [userPhone,    setUserPhone]    = useState('');

  // ── Password strength ─────────────────────────────────────────────────────
  const [strength,     setStrength]     = useState('');

  // ── Load email + phone for display ───────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const loadContact = async () => {
      try {
        const res = await getUserContactInfo(userId);
        if (res.data.status === 'Success') {
          setUserEmail(res.data.data.uemail || '');
          setUserPhone(res.data.data.uphone || '');
        }
      } catch (err) {
        console.error('Load contact error:', err);
      }
    };
    loadContact();
  }, [userId]);

  // ── Password strength checker ─────────────────────────────────────────────
  const checkStrength = (password) => {
    if (!password) { setStrength(''); return; }
    let score = 0;
    if (password.length >= 6)                              score++;
    if (password.length >= 10)                             score++;
    if (/[A-Z]/.test(password))                            score++;
    if (/[a-z]/.test(password))                            score++;
    if (/[0-9]/.test(password))                            score++;
    if (/[!@#$%^&*()_+\-=\[\]{}]/.test(password))         score++;
    if      (score <= 2) setStrength('weak');
    else if (score <= 4) setStrength('medium');
    else                 setStrength('strong');
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!currentPassword)              errs.currentPassword    = 'Current password is required.';
    if (!newPassword)                  errs.newPassword        = 'New password is required.';
    else if (newPassword.length < 6)   errs.newPassword        = 'Must be at least 6 characters.';
    else if (!/[A-Z]/.test(newPassword)) errs.newPassword      = 'Must contain at least one uppercase letter.';
    else if (!/[0-9]/.test(newPassword)) errs.newPassword      = 'Must contain at least one number.';
    else if (newPassword === currentPassword) errs.newPassword  = 'New password must differ from current.';
    if (!confirmNewPassword)           errs.confirmNewPassword  = 'Please confirm your new password.';
    else if (newPassword !== confirmNewPassword) errs.confirmNewPassword = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.data.status === 'Success') {
        // ✅ Success
showToast({
  title:       'Password Changed',
  description: 'Your password has been updated successfully.',
  type:        'success'
});
        setSuccessMsg('✅ Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setStrength('');
        setErrors({});

      } else {
          showToast({
  title:       'Passwords Do Not Match',
  description: 'New password and confirm password must be the same.',
  type:        'warning'
});
        setErrorMsg(res.data.result || 'Failed to update password.');
        // Highlight current password field if wrong
        if (res.data.result?.includes('incorrect')) {
          setErrors({ currentPassword: 'Current password is incorrect.' });

        }
      }
    } catch (err) {
       // ❌ Wrong current password
showToast({
  title:       'Incorrect Password',
  description: 'The current password you entered is wrong. Please try again.',
  type:        'error'
});
      console.error('changePassword error:', err);
      setErrorMsg('Something went wrong. Please try again.');

    } finally {
      setLoading(false);
      // ❌ Wrong current password
showToast({
  title:       'Incorrect Password',
  description: 'The current password you entered is wrong. Please try again.',
  type:        'error'
});
    }
  };

  // ── Eye icon button ───────────────────────────────────────────────────────
  const EyeBtn = ({ show, toggle }) => (
    <button
      type="button"
      className="cpw-eye"
      onClick={toggle}
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      <i className={show ? 'far fa-eye-slash' : 'far fa-eye'}></i>
    </button>
  );

  // ── Strength bar ──────────────────────────────────────────────────────────
  const StrengthBar = () => {
    if (!strength) return null;
    const labels = { weak: '⚠ Weak', medium: '👍 Medium', strong: '✅ Strong' };
    return (
      <div className={`cpw-strength cpw-strength--${strength}`}>
        <div className="cpw-strength__bars">
          {[0, 1, 2].map((i) => (
            <div key={i} className="cpw-strength__bar" />
          ))}
        </div>
        <span className="cpw-strength__label">
          {labels[strength]}
        </span>
      </div>
    );
  };

  // =========================================================================
  //  RENDER
  // =========================================================================
  return (
    <>
      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container">
          <h3>🔒 Change Password</h3>
        </div>
      </div>

      <div className="inner-content cpw-page">
        <div className="container">
          <div className="profile-Wrap">
            <div className="row">
              <Sidebar />

              <div className="col-lg-8 col-md-8">
                <div className="cpw">
                  <div className="cpw-card">

                    <div className="cpw-head">
                      <span className="cpw-head__icon" aria-hidden="true">
                        <i className="fas fa-key"></i>
                      </span>
                      <h3>Change Password</h3>
                    </div>

                    <form className="cpw-form" onSubmit={handleSubmit}>

                      {/* ── Read-only user info ─────────────────────────── */}
                      <div className="cpw-grid cpw-grid--info">
                        <div className="cpw-field">
                          <label className="cpw-label" htmlFor="cpw-email">
                            <i className="far fa-envelope" aria-hidden="true"></i>
                            Email
                          </label>
                          <input
                            id="cpw-email"
                            type="text"
                            className="form-control cpw-input cpw-input--readonly"
                            value={userEmail}
                            readOnly
                          />
                        </div>
                        <div className="cpw-field">
                          <label className="cpw-label" htmlFor="cpw-phone">
                            <i className="fas fa-phone" aria-hidden="true"></i>
                            Phone
                          </label>
                          <input
                            id="cpw-phone"
                            type="text"
                            className="form-control cpw-input cpw-input--readonly"
                            value={userPhone}
                            readOnly
                          />
                        </div>
                      </div>

                      <hr className="cpw-divider" />

                      {/* ── Global success/error messages ───────────────── */}
                      {successMsg && (
                        <div className="cpw-alert cpw-alert--success" role="status">
                          {successMsg}
                        </div>
                      )}
                      {errorMsg && (
                        <div className="cpw-alert cpw-alert--error" role="alert">
                          <i className="fas fa-times-circle"></i>
                          {errorMsg}
                        </div>
                      )}

                      {/* ── Password fields ─────────────────────────────── */}
                      <div className="cpw-grid">

                        {/* Current Password */}
                        <div className="cpw-field cpw-field--full">
                          <label className="cpw-label" htmlFor="cpw-current">
                            Current Password <span className="cpw-star">*</span>
                          </label>
                          <div className="cpw-input-wrap">
                            <input
                              id="cpw-current"
                              type={showCurrent ? 'text' : 'password'}
                              className={`form-control cpw-input ${errors.currentPassword ? 'is-error' : ''}`}
                              placeholder="Enter your current password"
                              value={currentPassword}
                              onChange={(e) => {
                                setCurrentPassword(e.target.value);
                                setErrors(prev => ({ ...prev, currentPassword: '' }));
                                setErrorMsg('');
                              }}
                            />
                            <EyeBtn show={showCurrent} toggle={() => setShowCurrent(p => !p)} />
                          </div>
                          {errors.currentPassword && (
                            <span className="cpw-error">{errors.currentPassword}</span>
                          )}
                        </div>

                        {/* New Password */}
                        <div className="cpw-field">
                          <label className="cpw-label" htmlFor="cpw-new">
                            New Password <span className="cpw-star">*</span>
                          </label>
                          <div className="cpw-input-wrap">
                            <input
                              id="cpw-new"
                              type={showNew ? 'text' : 'password'}
                              className={`form-control cpw-input ${errors.newPassword ? 'is-error' : ''}`}
                              placeholder="Enter new password"
                              value={newPassword}
                              onChange={(e) => {
                                setNewPassword(e.target.value);
                                checkStrength(e.target.value);
                                setErrors(prev => ({ ...prev, newPassword: '' }));
                              }}
                            />
                            <EyeBtn show={showNew} toggle={() => setShowNew(p => !p)} />
                          </div>
                          <StrengthBar />
                          {errors.newPassword && (
                            <span className="cpw-error">{errors.newPassword}</span>
                          )}
                        </div>

                        {/* Confirm New Password */}
                        <div className="cpw-field">
                          <label className="cpw-label" htmlFor="cpw-confirm">
                            Confirm New Password <span className="cpw-star">*</span>
                          </label>
                          <div className="cpw-input-wrap">
                            <input
                              id="cpw-confirm"
                              type={showConfirm ? 'text' : 'password'}
                              className={`form-control cpw-input ${errors.confirmNewPassword ? 'is-error' : ''}`}
                              placeholder="Re-enter new password"
                              value={confirmNewPassword}
                              onChange={(e) => {
                                setConfirmNewPassword(e.target.value);
                                setErrors(prev => ({ ...prev, confirmNewPassword: '' }));
                              }}
                            />
                            <EyeBtn show={showConfirm} toggle={() => setShowConfirm(p => !p)} />
                          </div>
                          {/* Live match indicator */}
                          {confirmNewPassword && newPassword && (
                            <span className={`cpw-match ${confirmNewPassword === newPassword ? 'is-ok' : 'is-bad'}`}>
                              {confirmNewPassword === newPassword
                                ? '✅ Passwords match'
                                : '❌ Passwords do not match'}
                            </span>
                          )}
                          {errors.confirmNewPassword && (
                            <span className="cpw-error">{errors.confirmNewPassword}</span>
                          )}
                        </div>

                      </div>

                      {/* ── Password requirements checklist ──────────────── */}
                      <div className="cpw-reqs">
                        <strong className="cpw-reqs__title">
                          Password requirements:
                        </strong>
                        <ul>
                          <li className={`cpw-req ${newPassword.length >= 6 ? 'is-met' : ''}`}>
                            {newPassword.length >= 6 ? '✓' : '○'} At least 6 characters
                          </li>
                          <li className={`cpw-req ${/[A-Z]/.test(newPassword) ? 'is-met' : ''}`}>
                            {/[A-Z]/.test(newPassword) ? '✓' : '○'} One uppercase letter
                          </li>
                          <li className={`cpw-req ${/[0-9]/.test(newPassword) ? 'is-met' : ''}`}>
                            {/[0-9]/.test(newPassword) ? '✓' : '○'} One number
                          </li>
                        </ul>
                      </div>

                      {/* ── Submit button ───────────────────────────────── */}
                      <div className="cpw-actions">
                        <button
                          type="submit"
                          className="sub cpw-submit"
                          disabled={loading}
                        >
                          {loading
                            ? <><i className="fas fa-spinner fa-spin"></i>Updating...</>
                            : <><i className="fas fa-lock"></i>Update Password</>
                          }
                        </button>
                      </div>

                    </form>
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

export default ChangePassword;
