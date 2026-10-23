
import '../../../../assets/css/pages/private-sidebar.css';
import React, { useEffect, useState, useContext, useRef } from 'react'
import Profiles from '../../../templates/ImagesLoader'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../../../hooks/AuthContext';
import { fetchUserDetails, fetchUserGallery } from '../../../../services/userService';
import { getUnreadMessageCount } from '../../../../services/messageService';
import profilepics from '../../../templates/ImagesLoader';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { imageUrl, approvedOnly, approvedProfileImage } from '../../../../utils/imageUrl';

const Sidebar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { logout } = useContext(AuthContext);

  const [getGallery,     setGetGallery]     = useState([]);
  const [userDetails,    setUserDetails]    = useState([]);
  const [copied,         setCopied]         = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // ── Mobile: collapsible sidebar nav ───────────────────────────────────────
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Nav starts collapsed on mobile, always open on desktop.
  const [navOpen, setNavOpen] = useState(!(window.innerWidth < 768));
  // Keep nav shown on desktop even if the window is resized up from mobile.
  useEffect(() => { if (!isMobile) setNavOpen(true); }, [isMobile]);

  // Gallery section is shown everywhere on desktop, but on mobile only on the
  // Gallery page itself (/addgallery).
  const showGallerySection = !isMobile || location.pathname === '/addgallery';

  // Navigate to a tab, then scroll to the page's main content column so the user
  // lands focused on that section instead of at the top (behind the sidebar).
  const goToTab = (e, path) => {
    if (e) e.preventDefault();
    if (isMobile) setNavOpen(false); // collapse the menu after a selection
    navigate(path);
    // Let the destination render, then scroll its content column into view.
    setTimeout(() => {
      const content = document.querySelector('.profile-Wrap .col-lg-8');
      if (content) {
        content.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 150);
  };

  // ✅ stable userId — not recreated every render
  const userId     = React.useMemo(() => localStorage.getItem("userId"), []);
  // ✅ fetch-once guard — prevents StrictMode double-invoke and re-fetch on parent re-render
  const hasFetched = useRef(false);

  const logoutHandler = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  useEffect(() => {
    // ✅ Only fetch once — this is the key fix for repeated API calls
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchUserData = async () => {
      try {
        // ✅ All 3 calls in parallel — faster than sequential
        const [userDetailsRes, galleryRes, msgRes] = await Promise.all([
          fetchUserDetails(userId),
          fetchUserGallery(userId),
          getUnreadMessageCount(userId)
        ]);
        setUserDetails(userDetailsRes.data);
        setGetGallery(galleryRes.data);
        if (msgRes.data.status === 'Success') {
          setUnreadMessages(msgRes.data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Sidebar fetch error:', error);
      }
    };

    fetchUserData();
  }, []); // ✅ empty deps — runs exactly once on mount

  return (
    <>
    <div className="col-lg-4 col-md-4 sbr">
      {/* Profile card (name, photo, MAT id, phone, email, city/state) —
          hidden on mobile per request; shown on desktop. */}
      {!isMobile && (
      <div className="sbr__card sbr__profile">
        <h3 className="sbr__name"><span className="user-name">{userDetails.ufname || 'user'}</span>'s Profile</h3>

        <div className="sbr__avatar">
          <div className="sbr__avatar-frame">
            <PhotoProvider>
              {getGallery.length > 0 ? (
                (() => {
                  const profileFile = approvedProfileImage(getGallery);
                  return profileFile ? (
                    // ✅ PhotoView src — original (full size for lightbox)
                    // ✅ img src      — medium (display in sidebar)
                    <PhotoView src={imageUrl(profileFile.imagepath)}>
                      <img
                        src={imageUrl(profileFile.imagepath_medium) || imageUrl(profileFile.imagepath)}
                        alt="Profile"
                      />
                    </PhotoView>
                  ) : (
                    <img src={profilepics.notfound} alt="Default profile" />
                  );
                })()
              ) : (
                <img src={profilepics.notfound} alt="Default profile" />
              )}
            </PhotoProvider>
          </div>
        </div>

        <div className="sbr__info">
          <h2 className="sbr__mat">
            <span
              className={`sbr__mat-chip ${copied ? 'is-copied' : ''}`}
              onClick={() => {
                const matId = `MAT${userDetails.uid || '---'}`;
                navigator.clipboard.writeText(matId).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              title="Click to copy"
            >
              {copied
                ? <><i className="fas fa-check"></i>Copied!</>
                : <>MAT{userDetails.uid || '---'} <i className="far fa-copy"></i></>
              }
            </span>
          </h2>
          <p><i className="fa fa-phone" aria-hidden="true"></i> {userDetails.uphone}</p>
          <p><i className="fa fa-envelope" aria-hidden="true"></i>{userDetails.uemail}</p>
          <p><i className="fas fa-map-marker-alt"></i>{userDetails.upresentloc ? userDetails.upresentloc : "Not Available"},{userDetails.ustate}</p>
        </div>
      </div>
      )}

      <div className="sbr__card sbr__menu">
        {/* Mobile-only collapse/expand toggle for the menu */}
        {isMobile && (
          <button
            type="button"
            className={`sbr__toggle ${navOpen ? 'is-open' : ''}`}
            onClick={() => setNavOpen(o => !o)}
            aria-expanded={navOpen}
            aria-label={navOpen ? 'Collapse menu' : 'Expand menu'}
          >
            <span><i className="fas fa-bars"></i> My Account</span>
            <i className={navOpen ? 'fas fa-chevron-up' : 'fas fa-chevron-down'} aria-hidden="true"></i>
          </button>
        )}

        {navOpen && (
        <ul className="sbr__nav">
          <li><Link className="sbr__link" to="/dashboard" onClick={(e) => goToTab(e, '/dashboard')}><i className="fas fa-tachometer-alt"></i> Dashboard</Link></li>
          <li><Link className="sbr__link" to="/editprofile" onClick={(e) => goToTab(e, '/editprofile')}><i className="fas fa-edit"></i> Edit Profile</Link></li>
          <li><Link className="sbr__link" to="/addgallery" onClick={(e) => goToTab(e, '/addgallery')}><i className="fas fa-images"></i> Gallery</Link></li>
          <li>
            <Link className="sbr__link" to="/messages" onClick={(e) => goToTab(e, '/messages')}>
              <i className="far fa-comment"></i> Messages{' '}
              {unreadMessages > 0 && (
                <span className="sbr__badge">{unreadMessages > 99 ? '99+' : unreadMessages}</span>
              )}
            </Link>
          </li>
          <li><Link className="sbr__link" to="/changepassword" onClick={(e) => goToTab(e, '/changepassword')}><i className="fas fa-key"></i> Change Password</Link></li>
          <li>
            <Link className="sbr__link" to="/profilesecurity" onClick={(e) => goToTab(e, '/profilesecurity')}>
              <i className="fas fa-shield-alt"></i> Profile Security
            </Link>
          </li>
          <li>
            <Link className="sbr__link sbr__link--danger" to="/closeaccount" onClick={(e) => goToTab(e, '/closeaccount')}>
              <i className="fas fa-times"></i> Close My Account
            </Link>
          </li>
          <li>
            <a className="sbr__link sbr__link--logout" href="#" onClick={logoutHandler}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </a>
          </li>
        </ul>
        )}
      </div>

      {showGallerySection && (
      <div className="sbr__card sbr__gallery">
        <h2 className="sbr__title">Gallery</h2>
        <PhotoProvider>
          <div className="sbr__grid">
            {approvedOnly(getGallery).map(res => (
              <div className="sbr__tile" key={res.id}>
                {/* ✅ PhotoView src — original (full size for lightbox) */}
                {/* ✅ img src      — thumb (150×150 for small gallery grid) */}
                <PhotoView src={imageUrl(res.imagepath)}>
                  <div className="sbr__thumb">
                    <img
                      src={imageUrl(res.imagepath_thumb) || imageUrl(res.imagepath)}
                      alt="Profile Gallery"
                    />
                    <div className="sbr__hover" aria-hidden="true">
                      <span className="sbr__plus"><i className="fas fa-plus"></i></span>
                    </div>
                  </div>
                </PhotoView>
              </div>
            ))}
          </div>
        </PhotoProvider>
      </div>
      )}
    </div>
    </>
  );
};

export default Sidebar;
