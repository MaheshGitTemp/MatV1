// src/components/hooks/ToastContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import '../../assets/css/pages/toast.css';

const ToastContext = createContext(null);

// ── Toast types → icon + colour variant (colours live in toast.css) ──────────
const TOAST_STYLES = {
  success: {
    variant: 'success',
    icon:    'far fa-check-circle'
  },
  error: {
    variant: 'error',
    icon:    'fas fa-times-circle'
  },
  warning: {
    variant: 'warning',
    icon:    'fas fa-exclamation-triangle'
  },
  info: {
    variant: 'info',
    icon:    'fas fa-info-circle'
  }
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ title, description, type = 'success', duration = 3500 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, description, type, duration }]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

// ── Toast Container — fixed bottom-right (bottom-centre full width on phones) ─
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="tst-stack" aria-live="polite">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

// ── Single Toast ──────────────────────────────────────────────────────────────
const Toast = ({ toast, onClose }) => {
  const { title, description, type, duration } = toast;
  const style = TOAST_STYLES[type] || TOAST_STYLES.success;

  return (
    <div className={`tst tst--${style.variant}`}>
      {/* Progress bar — duration is runtime data, so only the timing is inline */}
      <div className="tst__bar" style={{ animationDuration: `${duration}ms` }} />

      <div className="tst__body">
        {/* Icon */}
        <span className="tst__icon" aria-hidden="true">
          <i className={style.icon} />
        </span>

        {/* Text */}
        <div className="tst__text">
          {title && <div className="tst__title">{title}</div>}
          {description && <div className="tst__desc">{description}</div>}
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="tst__close"
          aria-label="Dismiss notification"
        >
          &times;
        </button>
      </div>
    </div>
  );
};
