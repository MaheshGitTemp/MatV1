import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import '../../assets/css/style.css';
import '../../assets/css/bootstrap.min.css';
// Removed duplicate imports: bootstrap.css (same framework as bootstrap.min.css)
// and a local all.min.css (FontAwesome is already loaded globally in index.js).
import profiles from "../templates/ImagesLoader";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from '../hooks/AuthContext';
import "./dropdown.css";
import { imageUrl, approvedProfileImage } from '../../utils/imageUrl';

// import api from '../../utils/api';
import { fetchUserDetails, fetchUserGallery } from '../../services/userService';
// Replace: import api from '../../utils/api';
import {
  getNotifications,
  getSenderNotifications,
  getUnreadCount,
  markNotificationsRead,
  markSenderNotificationsRead,
  acceptProposal,
  rejectProposal,
  fetchReceivedUnreadCount,
  fetchSentUnreadCount
} from '../../services/proposalService';

const Header = () => {

  // ─── Dropdowns ────────────────────────────────────────────────────────────
  const [isDropdownVisible,     setIsDropdownVisible]     = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const navigate    = useNavigate();
  const authcontext = useContext(AuthContext);
  const { loginuser, logout } = authcontext;
  // ✅ stable userId — not recreated on every render
  const userId = React.useMemo(() => localStorage.getItem("userId"), []);

  const logoutHandler = () => { logout(); navigate('/login'); };

  // ─── Mobile ───────────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ─── Close on outside click ───────────────────────────────────────────────
  const headerRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setIsDropdownVisible(false);
        setIsNotificationVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Fixed-header spacer: match spacer height to the real header height ────
  // The header is position:fixed (out of flow), so a spacer below it reserves
  // the space. We measure the actual rendered height (it can differ from a
  // hardcoded guess once the logo/tagline/buttons wrap) so the menu bar that
  // follows never slides under the header.
  const [headerHeight, setHeaderHeight] = useState(78);
  useEffect(() => {
    const measure = () => {
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [loginuser]); // re-measure when auth state changes the header contents

  // ─── User profile ─────────────────────────────────────────────────────────
  const [userDetails, setUserDetails] = useState({});
  const [getGallery,  setGetGallery]  = useState([]);
  // ✅ fetch-once guard
  const profileFetched = useRef(false);

  useEffect(() => {
    if (!userId || profileFetched.current) return;
    profileFetched.current = true;
    const load = async () => {
      try {
        const [detailsRes, galleryRes] = await Promise.all([
          fetchUserDetails(userId),
          fetchUserGallery(userId)
        ]);
        setUserDetails(detailsRes.data);
        setGetGallery(galleryRes.data);
      } catch (e) { console.error('Header profile load error:', e); }
    };
    load();
  }, []); // ✅ empty deps — runs once only

  // ✅ Use thumbnail for fast loading, fallback to original, then default avatar.
  // Only show the profile image if it is APPROVED (the owner's own gallery can
  // include pending/rejected images, which must not appear as the avatar).
  const approvedProfile = approvedProfileImage(getGallery);
  const profilePic = imageUrl(
    approvedProfile?.imagepath_thumb
    || approvedProfile?.imagepath
  ) || profiles.authorimg;

  // ─── Navbar ───────────────────────────────────────────────────────────────
  const [isActive, setIsActive] = useState(false);

  // =========================================================================
  //  NOTIFICATION STATE
  //  Two separate lists merged into one bell:
  //  1. receivedNotifs  — proposals sent TO me   (I am receiver/User 1)
  //  2. responseNotifs  — responses TO my proposals (I am sender/User 2)
  // =========================================================================
  const [receivedNotifs,  setReceivedNotifs]  = useState([]);  // User 1 view
  const [responseNotifs,  setResponseNotifs]  = useState([]);  // User 2 view
  const [unreadCount,     setUnreadCount]     = useState(0);
  const [notifLoading,    setNotifLoading]    = useState(false);
  const [notifError,      setNotifError]      = useState('');

  // ─── Fetch proposals I received (User 1) ─────────────────────────────────
  const fetchReceivedNotifs = useCallback(async () => {
    if (!userId) return 0;
    try {
      const res = await getNotifications(userId);
      if (res.data.status === 'Success') {
        setReceivedNotifs(res.data.data || []);
        return res.data.unreadCount || 0;
      }
    } catch (err) { console.error('[NOTIF] fetchReceivedNotifs error:', err); }
    return 0;
  }, []); // ✅ empty deps — userId is stable via useMemo

  // ─── Fetch responses to my sent proposals (User 2) ───────────────────────
  const fetchResponseNotifs = useCallback(async () => {
    if (!userId) return 0;
    try {
      const res = await getSenderNotifications(userId);
      if (res.data.status === 'Success') {
        setResponseNotifs(res.data.data || []);
        return res.data.unreadCount || 0;
      }
    } catch (err) { console.error('[NOTIF] fetchResponseNotifs error:', err); }
    return 0;
  }, []); // ✅ empty deps

  // ─── Fetch both + update combined badge count ─────────────────────────────
  const fetchAllNotifications = useCallback(async () => {
    if (!userId) return;
    setNotifLoading(true);
    setNotifError('');
    try {
      const [receivedUnread, responseUnread] = await Promise.all([
        fetchReceivedNotifs(),
        fetchResponseNotifs()
      ]);
      setUnreadCount(receivedUnread + responseUnread);
    } catch (err) {
      console.error('[NOTIF] fetchAllNotifications error:', err);
      setNotifError('Error loading notifications.');
    } finally {
      setNotifLoading(false);
    }
  }, []); // ✅ empty deps

  // ─── Poll badge count every 30s ───────────────────────────────────────────
  const pollUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const [r1, r2] = await Promise.all([
        fetchReceivedUnreadCount(userId),
        fetchSentUnreadCount(userId)
      ]);
      const c1 = r1.data.status === 'Success' ? (r1.data.unreadCount || 0) : 0;
      const c2 = r2.data.status === 'Success' ? (r2.data.unreadCount || 0) : 0;
      setUnreadCount(c1 + c2);
    } catch (err) { console.error('[NOTIF] poll error:', err); }
  }, []); // ✅ empty deps

  // Load on mount + poll every 30s
  // ✅ hasFetched prevents StrictMode double-invoke
  // ✅ fetchAllNotifications and pollUnreadCount have empty deps so stable
  const notifFetched = useRef(false);
  useEffect(() => {
    if (!userId || notifFetched.current) return;
    notifFetched.current = true;
    fetchAllNotifications();
    const interval = setInterval(pollUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []); // ✅ empty deps — runs once only

  // ─── Mark all read (both tables) ─────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    if (!userId) return;
    try {
      await Promise.all([
        markNotificationsRead(userId),
        markSenderNotificationsRead(userId)
      ]);
      setUnreadCount(0);
    } catch (err) {
      console.error('[NOTIF] markAllRead error:', err);
    }
  }, []); // ✅ empty deps

  // ─── Toggle bell ──────────────────────────────────────────────────────────
  const toggleNotification = () => {
    const opening = !isNotificationVisible;
    setIsNotificationVisible(opening);
    setIsDropdownVisible(false);
    if (opening) {
      fetchAllNotifications(); // always fresh when opened
      markAllRead();
    }
  };

  const toggleDropdown = () => {
    setIsDropdownVisible(p => !p);
    setIsNotificationVisible(false);
  };

  // ─── Accept proposal ──────────────────────────────────────────────────────
  const handleAccept = async (proposalId) => {
    try {
      // const res = await api.post('/acceptProposal', {
      //   proposal_id: proposalId,
      //   receiver_id: Number(userId)
      // });
      const res = await acceptProposal(proposalId, userId);
      if (res.data.status === 'Success') {
        setReceivedNotifs(prev =>
          prev.map(n => n.id === proposalId ? { ...n, status: 'accepted' } : n)
        );
      } else {
        alert(res.data.result || 'Could not accept proposal.');
      }
  } catch (err) { console.error('[NOTIF] acceptProposal error:', err); }
  };

  // ─── Reject proposal ──────────────────────────────────────────────────────
  const handleReject = async (proposalId) => {
    try {
      // const res = await api.post('/rejectProposal', {
      //   proposal_id: proposalId,
      //   receiver_id: Number(userId)
      // });
      const res = await rejectProposal(proposalId, userId);
      if (res.data.status === 'Success') {
        setReceivedNotifs(prev =>
          prev.map(n => n.id === proposalId ? { ...n, status: 'rejected' } : n)
        );
      } else {
        alert(res.data.result || 'Could not reject proposal.');
      }
    } catch (err) { console.error('[NOTIF] rejectProposal error:', err); }
  };

  // ─── Format date ──────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch { return dateStr; }
  };

  // ─── Render: proposal RECEIVED by me (User 1 view) ───────────────────────
  // Shows: "John sent you a proposal" + Accept/Reject or status
  const renderReceivedItem = (n) => {
    const { id, sender_id,ufname, ulname, status, created_at } = n;
    const name = `${ufname || ''} ${ulname || ''}`.trim() || 'Someone';
    return (
      <li key={`recv-${id}`} className="hdr-notif">
        <p>
          <Link
            to="/dashboard"                                 // ← clicking a proposal opens the full list
            onClick={() => setIsNotificationVisible(false)}  // ← closes bell dropdown
            className="hdr-notif__name"
          >
            {name}
          </Link>
          {' '}
          Has Send You Proposal
        </p>
        <div className="hdr-notif__time">
          <i className="far fa-clock"></i> {formatDate(created_at)}
        </div>

        {status === 'pending' && (
          <div className="hdr-notif__actions">
            <a href="#" className="hdr-notif__btn hdr-notif__btn--accept"
              onClick={(e) => { e.preventDefault(); handleAccept(id); }}>
              Accept
            </a>
            <a href="#" className="hdr-notif__btn hdr-notif__btn--reject"
              onClick={(e) => { e.preventDefault(); handleReject(id); }}>
              Reject
            </a>
          </div>
        )}
        {status === 'accepted' && (
          <div className="hdr-notif__status hdr-notif__status--ok">
            <i className="far fa-check-circle"></i> You have accepted proposal
          </div>
        )}
        {status === 'rejected' && (
          <div className="hdr-notif__status hdr-notif__status--no">
            <i className="fas fa-times"></i> You have Rejected proposal
          </div>
        )}
      </li>
    );
  };

  // ─── Render: response to MY sent proposal (User 2 view) ──────────────────
  // Shows: "Jane accepted your proposal" OR "Jane rejected your proposal"
  const renderResponseItem = (n) => {
    const { id,receiver_id, ufname, ulname, response_status, created_at } = n;
    const name = `${ufname || ''} ${ulname || ''}`.trim() || 'Someone';
    const isAccepted = response_status === 'accepted';
    return (
      <li key={`resp-${id}`} className="hdr-notif">
        <p>
          <Link
            to="/dashboard"                                 // ← clicking a proposal opens the full list
            onClick={() => setIsNotificationVisible(false)}  // ← closes bell dropdown
            className="hdr-notif__name"
          >
            {name}
          </Link>
          {' '}
          {isAccepted ? 'Accepted your proposal 🎉' : 'Rejected your proposal'}
        </p>
        <div className="hdr-notif__time">
          <i className="far fa-clock"></i> {formatDate(created_at)}
        </div>
        {isAccepted ? (
          <div className="hdr-notif__status hdr-notif__status--ok">
            <i className="far fa-check-circle"></i> Your proposal was accepted
          </div>
        ) : (
          <div className="hdr-notif__status hdr-notif__status--no">
            <i className="fas fa-times"></i> Your proposal was rejected
          </div>
        )}
      </li>
    );
  };

  // ─── Merge + sort both lists by date descending ───────────────────────────
  const allNotifications = [
    ...receivedNotifs.map(n => ({ ...n, _type: 'received' })),
    ...responseNotifs.map(n => ({ ...n, _type: 'response' }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Show at most 10 in the bell dropdown; the rest are reachable via the
  // "View all proposals" link that opens the full dashboard list.
  const NOTIF_PREVIEW_LIMIT = 10;
  const visibleNotifications = allNotifications.slice(0, NOTIF_PREVIEW_LIMIT);

  // Navigate to the full proposals list (dashboard) and close the dropdown.
  const goToAllProposals = (e) => {
    if (e) e.preventDefault();
    setIsNotificationVisible(false);
    navigate('/dashboard');
  };

  // =========================================================================
  //  RENDER
  // =========================================================================
  return (
    <>
      {/* Spacer offsets the fixed header so page content isn't hidden behind it.
          Height is measured from the real header so the menu bar can't overlap. */}
      <div style={{ height: `${headerHeight}px` }} aria-hidden="true" />

      <header className="site-header" ref={headerRef}>
        <div className="container">
          <div className="site-header__bar">

            {/* ── Logo (left) ── */}
            <Link to="/" className="site-logo" aria-label="Home">
              <img
                src={imageUrl("/uploads/gallery/telugu_sambandham_navbar_v16.png")}
                alt="Logo"
              />
            </Link>

            {/* ── Tagline (center on mobile, beside logo on desktop) ── */}
            <div className={isMobile ? 'site-brand is-mobile' : 'site-brand'}>
              {isMobile ? (
                // Compact centered tagline for mobile
                <>
                  <div className="site-brand__eyebrow">Trusted Matrimony</div>
                  <div className="site-brand__name"><strong>Viswabrahmin</strong></div>
                  <div className="site-brand__caption">Community</div>
                </>
              ) : (
                <>
                  <div className="site-brand__eyebrow">Trusted Matrimony</div>
                  <div className="site-brand__name">
                    For <strong>Viswabrahmin</strong>
                  </div>
                  <div className="site-brand__caption">Community</div>
                </>
              )}
            </div>

            <div className="site-actions">

                {/* Guest */}
                {!loginuser && (
                  <ul className={isMobile ? 'site-header__list site-header__list--mobile-guest' : 'site-header__list'}>
                    <li>
                      <Link to="/login" aria-label="Login" className="hdr-login">
                        <i className="fas fa-sign-in-alt"></i>{!isMobile && ' Login'}
                      </Link>
                    </li>
                    <li>
                      <Link to="/signup" className="hdr-join" aria-label="Signup">
                        <i className="far fa-user"></i>{isMobile ? ' Join' : ' Signup'}
                      </Link>
                    </li>
                  </ul>
                )}

                {/* Logged in */}
                {loginuser && (
                  <ul className="site-header__list">

                    {/* ── Bell ── */}
                    <li className="hdr-notif-wrap">
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); toggleNotification(); }}
                        className="hdr-icon"
                        aria-label="Notifications"
                      >
                        <i className="far fa-bell"></i>
                        {unreadCount > 0 && (
                          <span className="hdr-badge">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </a>

                      <ul
                        className="hdr-menu hdr-menu--notif"
                        style={{ display: isNotificationVisible ? 'block' : 'none' }}
                      >
                          {/* Title bar */}
                          <li className="hdr-menu__head">
                            <span>Notifications</span>
                            {unreadCount > 0 && (
                              <span className="hdr-chip">{unreadCount} new</span>
                            )}
                          </li>

                          {/* Loading */}
                          {notifLoading && (
                            <li className="hdr-menu__status">Loading...</li>
                          )}

                          {/* Error */}
                          {!notifLoading && notifError && (
                            <li className="hdr-menu__status hdr-menu__status--error">
                              {notifError}
                            </li>
                          )}

                          {/* Empty */}
                          {!notifLoading && !notifError && allNotifications.length === 0 && (
                            <li className="hdr-menu__status">
                              <i className="far fa-bell"></i>
                              No notifications yet.
                            </li>
                          )}

                          {/* Notifications merged and sorted by date — limited to 10 */}
                          {!notifLoading && !notifError && visibleNotifications.map(n =>
                            n._type === 'received'
                              ? renderReceivedItem(n)
                              : renderResponseItem(n)
                          )}

                          {/* View all proposals — opens the full list on the dashboard */}
                          {!notifLoading && !notifError && allNotifications.length > 0 && (
                            <li className="hdr-menu__foot">
                              <a href="/dashboard" onClick={goToAllProposals}>
                                View all proposals <i className="fas fa-arrow-right" style={{ fontSize: '11px' }}></i>
                              </a>
                            </li>
                          )}
                      </ul>
                    </li>

                    {/* ── User dropdown (icon on mobile, name pill on desktop) ── */}
                    <li className="hdr-user-wrap">
                      <a href="#" onClick={(e) => { e.preventDefault(); toggleDropdown(); }}
                        className={isMobile ? 'hdr-icon' : 'hdr-icon hdr-icon--pill'}
                        aria-label="User menu">
                        {isMobile ? (
                          <i className="fas fa-bars"></i>
                        ) : (
                          <>
                            <i className="far fa-user"></i>
                            <span>{userDetails.ufname || 'Me'}</span>
                          </>
                        )}
                      </a>
                      <ul className="hdr-menu hdr-menu--user"
                        style={{ display: isDropdownVisible ? 'block' : 'none' }}>
                        <li className="hdr-profile">
                          <img src={profilePic} alt="Profile" />
                          <div>
                            <span className="hdr-profile__name">{userDetails.ufname || 'User'}  MAT{userDetails.uid || '---'}</span>
                            <Link to="/editprofile" className="hdr-profile__edit">
                              <i className="fas fa-user-edit"></i> Edit Profile
                            </Link>
                          </div>
                        </li>
                        <li className="hdr-menu__item">
                          <Link to="/dashboard">
                            <i className="fas fa-tachometer-alt"></i> Dashboard
                          </Link>
                        </li>
                        <li className="hdr-menu__item">
                          <Link to="/addgallery">
                            <i className="fas fa-images"></i> Gallery
                          </Link>
                        </li>
                        <li className="hdr-menu__item">
                          <Link to="/changepassword">
                            <i className="fas fa-key"></i> Change Password
                          </Link>
                        </li>
                        <li className="hdr-menu__item hdr-menu__item--danger">
                          <Link to="/closeaccount">
                            <i className="fas fa-times"></i> Close My Account
                          </Link>
                        </li>
                        <li className="hdr-menu__item hdr-menu__item--danger">
                          <a href="#" onClick={logoutHandler}>
                            <i className="fas fa-sign-out-alt"></i> Logout
                          </a>
                        </li>
                      </ul>
                    </li>

                    {/* ── Language (desktop only; hidden on mobile) ── */}
                    {!isMobile && (
                      <li className="hdr-lang-wrap">
                        <a href="#" onClick={e => e.preventDefault()}
                          aria-label="Language"
                          className="hdr-icon">
                          <i className="fas fa-globe"></i>
                        </a>
                        <ul className="hdr-menu hdr-menu--lang">
                          <li className="hdr-menu__item"><a href="#" onClick={e => e.preventDefault()}>English</a></li>
                          <li className="hdr-menu__item"><a href="#" onClick={e => e.preventDefault()}>Urdu</a></li>
                          <li className="hdr-menu__item"><a href="#" onClick={e => e.preventDefault()}>Arabic</a></li>
                        </ul>
                      </li>
                    )}

                  </ul>
                )}
            </div>
          </div>
        </div>
      </header>

      {/* Navbar — hidden for guests, shown only when logged in */}
      {loginuser && (
      <nav className="navbar navbar-expand-lg navbar-dark hdr-subnav">
        <div className="container">
          <a className="navbar-brand" href="#" onClick={e => e.preventDefault()}>
            {isActive ? "Menu" : ""}
          </a>
          <button
            onClick={() => setIsActive(p => !p)}
            className="navbar-toggler"
            type="button"
            aria-label={isActive ? 'Collapse menu' : 'Expand menu'}
            aria-expanded={isActive}
          >
            {/* Arrow toggles the sidebar: up = expanded (collapse it),
                down = collapsed (expand it). Replaces the hamburger icon. */}
            <i className={isActive ? 'fas fa-chevron-up' : 'fas fa-chevron-down'}></i>
          </button>
          <div className={isActive ? 'collapse navbar-collapse show' : 'collapse navbar-collapse'}>
            <ul className="navbar-nav mr-auto">
              <li className="nav-item">
                <Link to="/profiles" className="nav-link">Matches</Link>
              </li>
               <li className="nav-item">
                <Link to="/advancesearch" className="nav-link">Advanced Search</Link>
              </li>
               <li className="nav-item">
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      )}
    </>
  );
};

export default Header;
