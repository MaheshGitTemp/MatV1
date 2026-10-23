


// src/components/pages/private/Dashboard.js
import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import Profiles from '../../templates/ImagesLoader';
import { Link } from 'react-router-dom';
import Sidebar from './templates/Sidebar';
import { fetchUserDetails } from '../../../services/userService';
import { AuthContext } from '../../hooks/AuthContext';
import {
  getNotifications,
  getSenderNotifications,
  getUnreadCount,
  acceptProposal,
  rejectProposal
} from '../../../services/proposalService';
import { getUnreadMessageCount, fetchInbox } from '../../../services/messageService';
import { imageUrl } from '../../../utils/imageUrl'; // profile pics now come from proposal query
import '../../../assets/css/pages/dashboard.css';

const Dashboard = () => {
  const { loginuser } = useContext(AuthContext);
  // ✅ stable userId — not recreated every render
  const userId = React.useMemo(() => localStorage.getItem('userId'), []);

  // ── Notification state ────────────────────────────────────────────────────
  const [receivedNotifs,      setReceivedNotifs]      = useState([]);
  const [responseNotifs,      setResponseNotifs]      = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [actionLoading,       setActionLoading]       = useState(null);
  const [userName,            setUserName]            = useState('');
  const [activeTab,           setActiveTab]           = useState('received');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [totalNotifications,  setTotalNotifications]  = useState(0);
  const [unreadMessages,      setUnreadMessages]      = useState(0);
  const [totalMessages,       setTotalMessages]       = useState(0);
  const [profileImages,       setProfileImages]       = useState({});

  // ✅ fetch-once guard — prevents StrictMode double-invoke
  const hasFetched = useRef(false);

  // ── Fetch unread + total counts ───────────────────────────────────────────
  // ✅ empty deps — userId is stable (useMemo), no re-creation needed
  const fetchUnreadCounts = useCallback(async () => {
    if (!userId) return;
    try {
      const [msgUnreadRes, notifUnreadRes, inboxRes] = await Promise.all([
        getUnreadMessageCount(userId),
        getUnreadCount(userId),
        fetchInbox(userId)
      ]);
      if (msgUnreadRes.data.status === 'Success')
        setUnreadMessages(msgUnreadRes.data.unreadCount || 0);
      if (notifUnreadRes.data.status === 'Success')
        setUnreadNotifications(notifUnreadRes.data.unreadCount || 0);
      if (inboxRes.data.status === 'Success')
        setTotalMessages(Array.isArray(inboxRes.data.data) ? inboxRes.data.data.length : 0);
    } catch (err) {
      console.error('[DASHBOARD] fetchUnreadCounts error:', err);
    }
  }, []); // ✅ empty deps

  // ── Fetch all proposal notifications ─────────────────────────────────────
  // ✅ Profile pics now come from proposal query — no separate GetUserGallery calls
  const fetchAllNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [receivedRes, responseRes] = await Promise.all([
        getNotifications(userId),
        getSenderNotifications(userId)
      ]);
      const received = receivedRes.data.status === 'Success'
        ? (receivedRes.data.data || []) : [];
      const response = responseRes.data.status === 'Success'
        ? (responseRes.data.data || []) : [];

      setReceivedNotifs(received);
      setResponseNotifs(response);
      setTotalNotifications(received.length + response.length);

      // ✅ Build profileImages from data already returned — zero extra API calls
      const images = {};
      received.forEach(n => {
        images[n.sender_id] = imageUrl(n.sender_pic_thumb)
          || imageUrl(n.sender_pic)
          || Profiles.notfound;
      });
      response.forEach(n => {
        images[n.receiver_id] = imageUrl(n.receiver_pic_thumb)
          || imageUrl(n.receiver_pic)
          || Profiles.notfound;
      });
      setProfileImages(images);

    } catch (err) {
      console.error('[DASHBOARD] fetchAllNotifications error:', err);
    } finally {
      setLoading(false);
    }
  }, []); // ✅ empty deps

  // ── On mount — fetch everything ONCE ─────────────────────────────────────
  // ✅ hasFetched ref prevents StrictMode double-invoke
  // ✅ empty deps array — runs once only
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const init = async () => {
      if (!userId) return;
      // Fetch user name + all data in parallel
      const [, , userRes] = await Promise.all([
        fetchAllNotifications(),
        fetchUnreadCounts(),
        fetchUserDetails(userId).catch(() => null)
      ]);
      if (userRes?.data?.ufname) setUserName(userRes.data.ufname);
    };

    init();
  }, []); // ✅ runs exactly once
  // ── Accept proposal ───────────────────────────────────────────────────────
  const handleAccept = async (proposalId) => {
    setActionLoading(proposalId);
    try {
      const res = await acceptProposal(proposalId, userId);
      if (res.data.status === 'Success') {
        setReceivedNotifs(prev =>
          prev.map(n => n.id === proposalId ? { ...n, status: 'accepted' } : n)
        );
        fetchUnreadCounts();
      } else {
        alert(res.data.result || 'Could not accept proposal.');
      }
    } catch (err) {
      console.error('[DASHBOARD] acceptProposal error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Reject proposal ───────────────────────────────────────────────────────
  const handleReject = async (proposalId) => {
    if (!window.confirm('Are you sure you want to reject this proposal?')) return;
    setActionLoading(proposalId);
    try {
      const res = await rejectProposal(proposalId, userId);
      if (res.data.status === 'Success') {
        setReceivedNotifs(prev =>
          prev.map(n => n.id === proposalId ? { ...n, status: 'rejected' } : n)
        );
        fetchUnreadCounts();
      } else {
        alert(res.data.result || 'Could not reject proposal.');
      }
    } catch (err) {
      console.error('[DASHBOARD] rejectProposal error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    try {
      const birth = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return isNaN(age) ? 'N/A' : `${age} Yrs`;
    } catch { return 'N/A'; }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return ''; }
  };

  const statusBadge = (status) => {
    const map = {
      pending: { cls: 'is-pending', label: '⏳ Pending' },
      accepted: { cls: 'is-accepted', label: '✅ Accepted' },
      rejected: { cls: 'is-rejected', label: '✗ Rejected' }
    };
    const s = map[status] || map.pending;
    return (
      <span className={`dsh-badge ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  // =========================================================================
  //  RENDER
  // =========================================================================
  return (
    <>
      {/* Heading */}
      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container">
          {/* <h3>Dashboard MAT-{loginuser}  </h3> */}
          {/* <h3> Welcome, {userName || 'User'}'s Dashboard</h3> */}
          <h3>Welcome back, {userName || 'User'}! 💕</h3>
        </div>
      </div>

      <div className="inner-content dsh-page">
        <div className="container">
          <div className="profile-Wrap">
            <div className="row">
              <Sidebar />

              <div className="col-lg-8 col-md-8">
                <div className="dsh">

                  {/* ── Stats Badges ─────────────────────────────────────── */}
                  <ul className="dsh-stats">

                    {/* Notifications stat */}
                    <li className="dsh-stat">
                      <div className="dsh-stat__icon">
                        <img src={Profiles.openjobs} alt="" />
                        {/* Unread badge dot */}
                        {unreadNotifications > 0 && (
                          <span className="dsh-stat__dot">
                            {unreadNotifications > 99 ? '99+' : unreadNotifications}
                          </span>
                        )}
                      </div>
                      <div className="dsh-stat__body">
                        {/* Total count */}
                        <div className="dsh-stat__count">{totalNotifications}</div>
                        <div className="dsh-stat__name">
                          Notifications
                          {/* Unread label below */}
                          {unreadNotifications > 0 && (
                            <span className="dsh-stat__hint">
                              {unreadNotifications} new proposals
                            </span>
                          )}
                        </div>
                      </div>
                    </li>

                    {/* Messages stat */}
                    <li className="dsh-stat">
                      <div className="dsh-stat__icon">
                        <img src={Profiles.mail} alt="" />
                        {/* Unread badge dot */}
                        {unreadMessages > 0 && (
                          <span className="dsh-stat__dot">
                            {unreadMessages > 99 ? '99+' : unreadMessages}
                          </span>
                        )}
                      </div>
                      <div className="dsh-stat__body">
                        {/* Total conversations count */}
                        <div className="dsh-stat__count">{totalMessages}</div>
                        <div className="dsh-stat__name">
                          Messages
                          {/* Unread label below */}
                          {unreadMessages > 0 && (
                            <span className="dsh-stat__hint">
                              {unreadMessages} unread messages
                            </span>
                          )}
                        </div>
                      </div>
                    </li>

                    {/* followers stat */}
                    <li className="dsh-stat">
                      <div className="dsh-stat__icon">
                        <img src={Profiles.followers} alt="" />
                      </div>
                      <div className="dsh-stat__body">
                        <div className="dsh-stat__count">0</div>
                        <div className="dsh-stat__name">Followers</div>
                      </div>
                    </li>

                  </ul>

                  {/* ── Package Info ─────────────────────────────────────── */}
                  <section className="dsh-card dsh-pkg">
                    <h2 className="dsh-section-title">Your Current Package</h2>
                    <ul className="dsh-pkg__grid">
                      <li>
                        <div className="dsh-pkg__card dsh-pkg__card--gold">
                          <h3>Current Package</h3>
                          <h6>Gold Package</h6>
                          <p>🎁 Free – Limited Launch Offer</p>
                        </div>
                      </li>
                      <li>
                        <div className="dsh-pkg__card">
                          <h3>Available Credits</h3>
                          <h6>Unlimited</h6>
                        </div>
                      </li>
                    </ul>
                  </section>

                  {/* ── Proposal Tables with Tab Switching ───────────────── */}
                  <section className="dsh-card">

                    {/* Tab Header */}
                    <div className="dsh-toolbar">
                      {/* Tab Buttons */}
                      <div className="dsh-tabs">
                        {/* Proposals Received button */}
                        <button
                          type="button"
                          className={`dsh-tab ${activeTab === 'received' ? 'is-active' : ''}`}
                          aria-pressed={activeTab === 'received'}
                          onClick={() => setActiveTab('received')}
                        >
                          <i className="far fa-bell"></i>
                          Proposals Received
                          {receivedNotifs.length > 0 && (
                            <span className="dsh-tab__count">
                              {receivedNotifs.length}
                            </span>
                          )}
                        </button>

                        {/* My Sent Proposals button */}
                        <button
                          type="button"
                          className={`dsh-tab ${activeTab === 'sent' ? 'is-active' : ''}`}
                          aria-pressed={activeTab === 'sent'}
                          onClick={() => setActiveTab('sent')}
                        >
                          <i className="far fa-paper-plane"></i>
                          My Sent Proposals
                          {responseNotifs.length > 0 && (
                            <span className="dsh-tab__count">
                              {responseNotifs.length}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Refresh button */}
                      <button
                        type="button"
                        className="dsh-refresh"
                        onClick={() => { fetchAllNotifications(); fetchUnreadCounts(); }}
                      >
                        <i className="fas fa-sync-alt"></i>
                        Refresh
                      </button>
                    </div>

                    {/* ── TAB 1: Proposals Received ─────────────────────── */}
                    {activeTab === 'received' && (
                      <div className="dsh-table-wrap">
                        {loading ? (
                          <div className="dsh-state">
                            <i className="fas fa-spinner fa-spin dsh-state__icon"></i>
                            Loading proposals...
                          </div>
                        ) : receivedNotifs.length === 0 ? (
                          <div className="dsh-state">
                            <i className="far fa-bell dsh-state__icon"></i>
                            No proposals received yet.
                          </div>
                        ) : (
                          <table className="dsh-table dsh-table--received">
                            <thead>
                              <tr>
                                <th>Image</th>
                                <th>MAT ID</th>
                                <th>Name</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th className="dsh-col-action">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {receivedNotifs.map(n => (
                                <tr key={n.id}>
                                  {/* Image */}
                                  <td>
                                    <Link to={`/profiledetails/${n.sender_id}`} className="dsh-avatar-link">
                                      <img
                                        className="dsh-avatar"
                                        src={profileImages[n.sender_id] || Profiles.notfound}
                                        alt={n.ufname}
                                        onError={e => { e.target.src = Profiles.notfound; }}
                                      />
                                    </Link>
                                  </td>
                                  {/* ID */}
                                  <td>
                                    <span className="dsh-mat">
                                      MAT{n.sender_id}
                                    </span>
                                  </td>
                                  {/* Name */}
                                  <td>
                                    <Link
                                      to={`/profiledetails/${n.sender_id}`}
                                      className="dsh-name"
                                    >
                                      {`${n.ufname || ''} ${n.ulname || ''}`.trim() || 'Unknown'}
                                    </Link>
                                  </td>
                                  {/* Date */}
                                  <td className="dsh-muted" data-label="Date">
                                    {formatDate(n.created_at)}
                                  </td>
                                  {/* Status */}
                                  <td data-label="Status">{statusBadge(n.status)}</td>
                                  {/* Actions */}
                                  <td className="dsh-col-action">
                                    {n.status === 'pending' ? (
                                      <div className="dsh-actions">
                                        <button
                                          type="button"
                                          onClick={() => handleAccept(n.id)}
                                          disabled={actionLoading === n.id}
                                          className="dsh-act dsh-act--accept"
                                        >
                                          {actionLoading === n.id ? '⏳' : '✓ Accept'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleReject(n.id)}
                                          disabled={actionLoading === n.id}
                                          className="dsh-act dsh-act--reject"
                                          title="Reject"
                                        >
                                          <i className="fas fa-times"></i> Reject
                                        </button>
                                      </div>
                                    ) : (
                                      <Link
                                        to={`/profiledetails/${n.sender_id}`}
                                        className="dsh-link"
                                      >
                                        View Profile
                                      </Link>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                    {/* ── TAB 2: My Sent Proposals Responses ───────────── */}
                    {activeTab === 'sent' && (
                      <div className="dsh-table-wrap">
                        {loading ? (
                          <div className="dsh-state">
                            <i className="fas fa-spinner fa-spin dsh-state__icon"></i>
                            Loading...
                          </div>
                        ) : responseNotifs.length === 0 ? (
                          <div className="dsh-state">
                            <i className="far fa-paper-plane dsh-state__icon"></i>
                            No responses to your sent proposals yet.
                          </div>
                        ) : (
                          <table className="dsh-table dsh-table--sent">
                            <thead>
                              <tr>
                                <th>Image</th>
                                <th>MAT ID</th>
                                <th>Name</th>
                                <th>Age</th>
                                <th>Date</th>
                                <th>Response</th>
                                <th className="dsh-col-action">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {responseNotifs.map(n => (
                                <tr key={n.id}>
                                  {/* Image */}
                                  <td>
                                    <Link to={`/profiledetails/${n.receiver_id}`} className="dsh-avatar-link">
                                      <img
                                        className="dsh-avatar"
                                        src={profileImages[n.receiver_id] || Profiles.notfound}
                                        alt={n.ufname}
                                        onError={e => { e.target.src = Profiles.notfound; }}
                                      />
                                    </Link>
                                  </td>
                                  {/* ID */}
                                  <td>
                                    <span className="dsh-mat">
                                      MAT{n.receiver_id}
                                    </span>
                                  </td>
                                  {/* Name */}
                                  <td>
                                    <Link
                                      to={`/profiledetails/${n.receiver_id}`}
                                      className="dsh-name"
                                    >
                                      {`${n.ufname || ''} ${n.ulname || ''}`.trim() || 'Unknown'}
                                    </Link>
                                  </td>
                                  {/* Age */}
                                  <td data-label="Age">{calculateAge(n.udob)}</td>
                                  {/* Date */}
                                  <td className="dsh-muted" data-label="Date">
                                    {formatDate(n.created_at)}
                                  </td>
                                  {/* Response */}
                                  <td data-label="Response">
                                    {n.response_status === 'accepted' ? (
                                      <span className="dsh-badge is-accepted">🎉 Accepted</span>
                                    ) : n.response_status === 'rejected' ? (
                                      <span className="dsh-badge is-rejected">✗ Rejected</span>
                                    ) : (
                                      <span className="dsh-badge is-pending">⏳ Awaiting</span>
                                    )}
                                  </td>
                                  {/* Actions */}
                                  <td className="dsh-col-action">
                                    <Link
                                      to={`/profiledetails/${n.receiver_id}`}
                                      className="dsh-link"
                                    >
                                      View Profile
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                  </section>
                  {/* end proposal tables */}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
