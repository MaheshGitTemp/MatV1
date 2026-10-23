
import React, { useEffect, useState } from 'react'
import Profiles from '../../templates/ImagesLoader'
import Sidebar from './templates/Sidebar'
import { getPrivacySettings, updatePrivacySettings } from '../../../services/userService';
import { useToast } from '../../../components/hooks/ToastContext';
import '../../../assets/css/pages/profile-security.css';
const ProfileSecurity = () => {
const { showToast } = useToast();
  // ── State ──────────────────────────────────────────────────────────────────
  const [settings, setSettings] = useState({
    hide_email:   false,
    hide_phone:   false,
    hide_gallery: false,
    hide_picture: false
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [message,  setMessage]  = useState({ text: '', type: '' }); // type: 'success'|'error'

  // ── Load settings on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getPrivacySettings();
        if (res.data.status === 'Success') {
          setSettings(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load privacy settings:', err);
        setMessage({ text: 'Failed to load settings. Please refresh.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // ── Auto-clear message after 3s ───────────────────────────────────────────
  useEffect(() => {
    if (!message.text) return;
    const t = setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    return () => clearTimeout(t);
  }, [message]);

  // ── Handle checkbox change ─────────────────────────────────────────────────
  const handleChange = (field) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // ── Handle form submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updatePrivacySettings(
        settings.hide_email,
        settings.hide_phone,
        settings.hide_gallery,
        settings.hide_picture
      );
      if (res.data.status === 'Success') {
        // ✅ Success
showToast({
  title:       'Settings Saved',
  description: 'Your privacy settings have been updated successfully.',
  type:        'success'
});
        setSettings(res.data.data); // sync with server response
        setMessage({ text: 'Privacy settings updated successfully.', type: 'success' });
      } else {
        // ❌ Failure
showToast({
  title:       'Save Failed',
  description: 'Could not update privacy settings. Please try again.',
  type:        'error'
});
        setMessage({ text: res.data.result || 'Update failed. Please try again.', type: 'error' });
      }
    } catch (err) {
      console.error('updatePrivacySettings error:', err);
      setMessage({ text: 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* <!--Inner Heading Start--> */}
      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container">
          <h3>Profile Security</h3>
        </div>
      </div>
      {/* <!--Inner Heading End--> */}

      {/* <!--Inner Content Start--> */}
      <div className="inner-content psec-page">
        <div className="container">
          <div className="profile-Wrap">
            <div className="row">

              <Sidebar />

              <div className="col-lg-8 col-md-8">
                <div className="psec">

                  {/* ── Profile Security Form ────────────────────────────── */}
                  <div className="psec-card">
                    <div className="psec-head">
                      <span className="psec-head__icon" aria-hidden="true">
                        <i className="fas fa-lock"></i>
                      </span>
                      <div>
                        <h3>Set Profile Security</h3>
                        <p>Mark Checkboxes to hide your personal info</p>
                      </div>
                    </div>

                    {/* ── Status Message ───────────────────────────────────── */}
                    {message.text && (
                      <div
                        className={`psec-alert ${message.type === 'success' ? 'psec-alert--success' : 'psec-alert--error'}`}
                        role="status"
                      >
                        <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                        {message.text}
                      </div>
                    )}

                    {/* ── Loading State ────────────────────────────────────── */}
                    {loading ? (
                      <div className="psec-loading">
                        <i className="fas fa-spinner fa-spin"></i>
                        Loading settings...
                      </div>
                    ) : (
                      <form className="psec-form" onSubmit={handleSubmit}>
                        <div className="psec-options">

                          {/* Hide Email */}
                          <div className="psec-option">
                            <input
                              type="checkbox"
                              className="psec-switch"
                              name="hide_email"
                              id="hdemail"
                              checked={settings.hide_email}
                              onChange={() => handleChange('hide_email')}
                            />
                            <label htmlFor="hdemail" className="psec-option__label">
                              <i className="fas fa-envelope" aria-hidden="true"></i>
                              Hide Email to Users
                            </label>
                          </div>

                          {/* Hide Phone */}
                          <div className="psec-option">
                            <input
                              type="checkbox"
                              className="psec-switch"
                              name="hide_phone"
                              id="hdphone"
                              checked={settings.hide_phone}
                              onChange={() => handleChange('hide_phone')}
                            />
                            <label htmlFor="hdphone" className="psec-option__label">
                              <i className="fas fa-phone" aria-hidden="true"></i>
                              Hide Phone to Users
                            </label>
                          </div>

                          {/* Hide Gallery */}
                          <div className="psec-option">
                            <input
                              type="checkbox"
                              className="psec-switch"
                              name="hide_gallery"
                              id="hdgallery"
                              checked={settings.hide_gallery}
                              onChange={() => handleChange('hide_gallery')}
                            />
                            <label htmlFor="hdgallery" className="psec-option__label">
                              <i className="fas fa-images" aria-hidden="true"></i>
                              Hide photo Gallery
                            </label>
                          </div>

                          {/* Hide Profile Picture */}
                          <div className="psec-option">
                            <input
                              type="checkbox"
                              className="psec-switch"
                              name="hide_picture"
                              id="hdpic"
                              checked={settings.hide_picture}
                              onChange={() => handleChange('hide_picture')}
                            />
                            <label htmlFor="hdpic" className="psec-option__label">
                              <i className="fas fa-user-circle" aria-hidden="true"></i>
                              Hide Profile picture
                            </label>
                          </div>

                        </div>

                        <div className="psec-actions">
                          <button
                            className="btn psec-submit"
                            type="submit"
                            title="Update Profile"
                            disabled={saving}
                          >
                            {saving
                              ? <><i className="fas fa-spinner fa-spin"></i>Saving...</>
                              : 'Update Security'
                            }
                          </button>
                        </div>
                      </form>
                    )}

                  </div>
                  {/* ── End Profile Security Form ─────────────────────────── */}

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      {/* <!--Inner Content End--> */}
    </>
  );
};

export default ProfileSecurity;
