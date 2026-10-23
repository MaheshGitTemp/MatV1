// src/components/pages/public/ForgotPassword.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import backImg from '../../templates/ImagesLoader';
import { sendOtp, verifyOtp, resetPassword } from '../../../services/authService';
import { useToast } from '../../../components/hooks/ToastContext';
import '../../../assets/css/pages/forgot-password.css';
const ForgotPassword = () => {
  const navigate = useNavigate();
const { showToast } = useToast();
 
  // ── Step state: 1=email, 2=otp, 3=new password, 4=success ───────────────
  const [step, setStep] = useState(1);

  // ── Form state ────────────────────────────────────────────────────────────
  const [email,           setEmail]           = useState('');
  const [otp,             setOtp]             = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading,      setLoading]      = useState(false);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [resendTimer,  setResendTimer]  = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // ── Eye toggle ────────────────────────────────────────────────────────────
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Password strength ─────────────────────────────────────────────────────
  const [strength, setStrength] = useState('');

  // ── Start resend countdown ────────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Password strength checker ─────────────────────────────────────────────
  const checkStrength = (pwd) => {
    if (!pwd) { setStrength(''); return; }
    let score = 0;
    if (pwd.length >= 6)                         score++;
    if (pwd.length >= 10)                        score++;
    if (/[A-Z]/.test(pwd))                       score++;
    if (/[a-z]/.test(pwd))                       score++;
    if (/[0-9]/.test(pwd))                       score++;
    if (/[!@#$%^&*()_+\-=\[\]{}]/.test(pwd))    score++;
    if      (score <= 2) setStrength('weak');
    else if (score <= 4) setStrength('medium');
    else                 setStrength('strong');
  };

  // ── STEP 1: Send OTP to email ─────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.'); return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address.'); return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(email);
      if (res.data.status === 'Success') {
        showToast({
  title:       'OTP Sent',
  description: `A 6-digit OTP has been sent to your email. Valid for 10 minutes.`,
  type:        'info'
});
        setStep(2);
        startResendTimer();
      } else {
        setErrorMsg(res.data.result || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otp || otp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP sent to your email.'); return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(email, otp);
      if (res.data.status === 'Success') {
        // OTP verified:
showToast({
  title:       'OTP Verified ✓',
  description: 'Identity confirmed. Please set your new password.',
  type:        'success'
});
        setStep(3);
      } else {
        setErrorMsg(res.data.result || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setResendLoading(true);
    setErrorMsg('');
    setOtp('');
    try {
      const res = await sendOtp(email);
      if (res.data.status === 'Success') {
        startResendTimer();
      } else {
        setErrorMsg('Failed to resend OTP. Please try again.');
      }
    } catch {
      setErrorMsg('Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  // ── STEP 3: Reset Password ─────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword) {
      setErrorMsg('Please enter a new password.'); return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.'); return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setErrorMsg('Password must contain at least one uppercase letter.'); return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setErrorMsg('Password must contain at least one number.'); return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.'); return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(email, newPassword);
      if (res.data.status === 'Success') {
        showToast({
  title:       'Password Reset Successful',
  description: 'Your password has been changed. Please login with your new password.',
  type:        'success',
  duration:    5000
});
        setStep(4);
      } else {
        setErrorMsg(res.data.result || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step indicator helper ─────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="fp-steps" aria-hidden="true">
      {[1, 2, 3].map(s => (
        <div
          key={s}
          className={`fp-step${step > s ? ' is-done' : step === s ? ' is-active' : ''}`}
        />
      ))}
    </div>
  );

  // =========================================================================
  //  RENDER
  // =========================================================================
  return (
    <div
      className="inner-content loginbg fp-page"
      style={{ backgroundImage: `URL(${backImg.loginbg})` }}
    >
      <div className="container fp-wrap">
        <div className="fp-card">

          {/* ── Card Header ───────────────────────────────────────────────── */}
          <div className="fp-hero">
            <div className="fp-hero__icon" aria-hidden="true">
              <i className="fas fa-key"></i>
            </div>
            <h4 className="fp-hero__title">
              Forgot Password
            </h4>
            <p className="fp-hero__sub">
              {step === 1 && 'Enter your email to receive a verification code'}
              {step === 2 && `OTP sent to ${email}`}
              {step === 3 && 'Create your new password'}
              {step === 4 && 'Password reset complete'}
            </p>
          </div>

          {/* ── Card Body ─────────────────────────────────────────────────── */}
          <div className="fp-body">

            {/* Step indicator — only for steps 1-3 */}
            {step < 4 && <StepIndicator />}

            {/* Error message */}
            {errorMsg && (
              <div className="fp-alert" role="alert">
                <i className="fas fa-times-circle"></i>
                {errorMsg}
              </div>
            )}

            {/* ── STEP 1: Enter Email ──────────────────────────────────── */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="fp-form">
                <label className="fp-label">
                  Email Address <span className="fp-req">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                  className={`form-control fp-input${errorMsg ? ' is-error' : ''}`}
                />
                <p className="fp-hint">
                  We'll send a 6-digit OTP to this email address.
                </p>
                <button type="submit" disabled={loading} className="fp-btn">
                  {loading
                    ? <><i className="fas fa-spinner fa-spin"></i>Sending OTP...</>
                    : <><i className="fas fa-paper-plane"></i>Send OTP</>
                  }
                </button>
              </form>
            )}

            {/* ── STEP 2: Verify OTP ───────────────────────────────────── */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="fp-form">
                {/* Email display */}
                <div className="fp-email">
                  <i className="far fa-envelope"></i>
                  <span className="fp-email__addr">{email}</span>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(''); setErrorMsg(''); }}
                    className="fp-link-btn fp-email__change"
                  >
                    Change
                  </button>
                </div>

                <label className="fp-label">
                  Enter 6-digit OTP <span className="fp-req">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="_ _ _ _ _ _"
                  value={otp}
                  onChange={e => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    setErrorMsg('');
                  }}
                  className={`form-control fp-input fp-otp${errorMsg ? ' is-error' : ''}`}
                />

                {/* Resend */}
                <div className="fp-resend">
                  {resendTimer > 0 ? (
                    <p className="fp-timer">
                      Resend OTP in <strong>{resendTimer}s</strong>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendLoading}
                      className="fp-link-btn"
                    >
                      {resendLoading ? '⏳ Sending...' : '🔄 Resend OTP'}
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="fp-btn"
                >
                  {loading
                    ? <><i className="fas fa-spinner fa-spin"></i>Verifying...</>
                    : <><i className="fas fa-check-circle"></i>Verify OTP</>
                  }
                </button>
              </form>
            )}

            {/* ── STEP 3: Set New Password ─────────────────────────────── */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="fp-form">

                {/* New Password */}
                <label className="fp-label">
                  New Password <span className="fp-req">*</span>
                </label>
                <div className="fp-pw">
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={e => {
                      setNewPassword(e.target.value);
                      checkStrength(e.target.value);
                      setErrorMsg('');
                    }}
                    className={`form-control fp-input${errorMsg ? ' is-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(p => !p)}
                    className="fp-pw__toggle"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    <i className={showNew ? 'far fa-eye-slash' : 'far fa-eye'}></i>
                  </button>
                </div>

                {/* Strength bar */}
                {strength && (
                  <div className={`fp-strength is-${strength}`}>
                    <div className="fp-strength__bars">
                      {['weak', 'medium', 'strong'].map((level, i) => (
                        <div
                          key={i}
                          className={`fp-strength__seg${(
                            (strength === 'weak' && i === 0) ||
                            (strength === 'medium' && i <= 1) ||
                            strength === 'strong'
                          ) ? ' is-on' : ''}`}
                        />
                      ))}
                    </div>
                    <span className="fp-strength__label">
                      {strength === 'weak' ? '⚠ Weak' : strength === 'medium' ? '👍 Medium' : '✅ Strong'}
                    </span>
                  </div>
                )}

                {/* Confirm Password */}
                <label className="fp-label fp-label--gap">
                  Confirm New Password <span className="fp-req">*</span>
                </label>
                <div className="fp-pw">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
                    className={`form-control fp-input${errorMsg ? ' is-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(p => !p)}
                    className="fp-pw__toggle"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    <i className={showConfirm ? 'far fa-eye-slash' : 'far fa-eye'}></i>
                  </button>
                </div>

                {/* Match indicator */}
                {confirmPassword && newPassword && (
                  <span className={`fp-match ${confirmPassword === newPassword ? 'is-ok' : 'is-bad'}`}>
                    {confirmPassword === newPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
                  </span>
                )}

                {/* Requirements */}
                <div className="fp-reqs">
                  {[
                    { check: newPassword.length >= 6, text: 'At least 6 characters'        },
                    { check: /[A-Z]/.test(newPassword), text: 'One uppercase letter'        },
                    { check: /[0-9]/.test(newPassword), text: 'One number'                  }
                  ].map((req, i) => (
                    <div key={i} className={`fp-req-item${req.check ? ' is-ok' : ''}`}>
                      {req.check ? '✓' : '○'} {req.text}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="fp-btn"
                >
                  {loading
                    ? <><i className="fas fa-spinner fa-spin"></i>Resetting Password...</>
                    : <><i className="fas fa-lock"></i>Reset Password</>
                  }
                </button>
              </form>
            )}

            {/* ── STEP 4: Success ──────────────────────────────────────── */}
            {step === 4 && (
              <div className="fp-success">
                <div className="fp-success__icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h5 className="fp-success__title">
                  Password Reset Successful!
                </h5>
                <p className="fp-success__text">
                  Your password has been updated successfully.<br />
                  You can now login with your new password.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="fp-btn"
                >
                  <i className="fas fa-sign-in-alt"></i>
                  Go to Login
                </button>
              </div>
            )}

            {/* ── Back to Login link ─────────────────────────────────── */}
            {step < 4 && (
              <div className="fp-back">
                <Link to="/login" className="fp-back__link">
                  <i className="fas fa-arrow-left"></i>
                  Back to Login
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
