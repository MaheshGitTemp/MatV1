
// src/components/pages/public/ProfileDetails.js
import React, { useEffect, useState } from 'react';
import profilepics from '../../templates/ImagesLoader';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import { useParams, useNavigate } from 'react-router-dom';
import '../../../assets/css/pages/profile-details.css';

import { imageUrl } from '../../../utils/imageUrl';
import { fetchUserDetails, fetchUserGallery, getUserContactInfo } from '../../../services/userService';
import { getPublicProfile, getPublicGallery } from '../../../services/listingService';
import { approvedOnly, approvedProfileImage } from '../../../utils/imageUrl';
import {
  sendProposal,
  getSentProposals,
  getNotifications
} from '../../../services/proposalService';
import { sendMessage } from '../../../services/messageService';
import { useToast } from '../../../components/hooks/ToastContext';

const ProfileDetails = () => {
  const { uid }    = useParams();
  const navigate   = useNavigate();
  const { showToast } = useToast();

  // Static "request sent" toast fired by the Request Photos button.
  const handleRequestPhotos = (e) => {
    if (e) e.preventDefault();
    showToast({
      title:       'Request sent',
      description: 'Request sent successfully.',
      type:        'success'
    });
  };

  const [userDetails, setUserDetails] = useState({});
  const [profileImage, setProfileImage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gallerydata, setGalleryData] = useState([]);

  // Hide ad images on mobile only (kept on desktop).
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Proposal state ────────────────────────────────────────────────────────
  const [proposalStatus,  setProposalStatus]  = useState('idle');
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposalDate,    setProposalDate]    = useState(null);

  // ── Message state ─────────────────────────────────────────────────────────
  const [messageStatus,  setMessageStatus]  = useState('idle');
  const [messageText,    setMessageText]    = useState('');
  const [messageDate,    setMessageDate]    = useState(null);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [showContactDetailsModal,  setShowContactDetailsModal]  = useState(false);

  // ── Contact details state ─────────────────────────────────────────────────
  const [contactInfo,       setContactInfo]       = useState(null);
  const [contactLoading,    setContactLoading]    = useState(false);
  const [contactError,      setContactError]      = useState('');
  const [contactErrorReason,setContactErrorReason]= useState(''); // 'contact_hidden' | 'daily_limit_reached' | ''
  const [contactRevealed,   setContactRevealed]   = useState(false);

  const loggedInUserId = localStorage.getItem("userId");

  // ── Scroll to top on mount ────────────────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // ── Reset contact state when profile changes ──────────────────────────────
  useEffect(() => {
    setContactInfo(null);
    setContactRevealed(false);
    setContactError('');
    setContactErrorReason('');
  }, [uid]);

  // ── Fetch profile details + gallery ──────────────────────────────────────
  useEffect(() => {
    if (!uid) return;

    const loadProfileData = async () => {
      try {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const myGender   = localStorage.getItem('userGender'); // 'Male' or 'Female'

        if (isLoggedIn) {
          const response    = await fetchUserDetails(uid);
          const fetchimage  = await fetchUserGallery(uid);
          const profileData = response.data;

          // ── Gender Guard ────────────────────────────────────────────────
          // Logged-in users can only view opposite gender profiles.
          // Own profile is always allowed.
          // If same gender → redirect to /profiles.
          if (profileData && myGender) {
            const profileGender = profileData.ugender;
            const isOwnProfile  = String(profileData.uid) === String(loggedInUserId);
            const isSameGender  = profileGender === myGender;

            if (isSameGender && !isOwnProfile) {
              navigate('/profiles');
              return;
            }
          }
          // ── End Gender Guard ─────────────────────────────────────────────

          // Only an APPROVED profile image may be shown (own-profile view can
          // include pending images from the gallery API).
          const profileImg = approvedProfileImage(fetchimage.data);
          setProfileImage(profileImg ? profileImg.imagepath : profilepics.notfound);
          setUserDetails(profileData);

        } else {
          // Guest — no gender restriction, use public endpoints
          const response   = await getPublicProfile(uid);
          const fetchimage = await getPublicGallery(uid);
          const profileImg = approvedProfileImage(fetchimage.data);
          setProfileImage(profileImg ? profileImg.imagepath : profilepics.notfound);
          setUserDetails(response.data.data || {});
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    const loadGalleryData = async () => {
      try {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const resp = isLoggedIn
          ? await fetchUserGallery(uid)
          : await getPublicGallery(uid);
        // Show only approved images in the public gallery/carousel.
        setGalleryData(approvedOnly(resp.data));
      } catch (error) {
        console.log(error);
      }
    };

    loadProfileData();
    loadGalleryData();
  }, [uid]);

  // ── Check proposal status ─────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const checkBothDirections = async () => {
      if (!loggedInUserId || !uid) return;
      if (String(loggedInUserId) === String(uid)) return;
      try {
        const [sentRes, receivedRes] = await Promise.all([
          getSentProposals(loggedInUserId),
          getNotifications(loggedInUserId)
        ]);
        if (!isMounted) return;
        if (sentRes.data.status === 'Success' && sentRes.data.data?.length > 0) {
          const iSent = sentRes.data.data.find(p => String(p.receiver_id) === String(uid));
          if (iSent) {
            if (iSent.status === 'pending')  { setProposalStatus('i_sent');     setProposalDate(iSent.created_at); return; }
            if (iSent.status === 'accepted') { setProposalStatus('i_accepted'); setProposalDate(iSent.created_at); return; }
            if (iSent.status === 'rejected') { setProposalStatus('i_rejected'); setProposalDate(iSent.created_at); return; }
          }
        }
        if (receivedRes.data.status === 'Success' && receivedRes.data.data?.length > 0) {
          const theySent = receivedRes.data.data.find(n => String(n.sender_id) === String(uid));
          if (theySent) { setProposalStatus('they_sent'); setProposalDate(theySent.created_at); return; }
        }
        setProposalStatus('idle');
      } catch (err) {
        if (isMounted) { console.error('[PROPOSAL] error:', err); setProposalStatus('idle'); }
      }
    };
    checkBothDirections();
    return () => { isMounted = false; };
  }, [loggedInUserId, uid]);

  // ── Fetch Contact Info from API ───────────────────────────────────────────
  const handleRevealContact = async () => {
    if (!loggedInUserId) return;
    setContactLoading(true);
    setContactError('');
    setContactErrorReason('');
    try {
      const response = await getUserContactInfo(uid);
      if (response.data.status === 'Success') {
        setContactInfo(response.data.data);
        setContactRevealed(true);
      } else {
        // reason: 'contact_hidden' | 'daily_limit_reached' | undefined.
        // Message text is built by the backend (includes the live limit value).
        setContactError(response.data.result || 'Failed to fetch contact details.');
        setContactErrorReason(response.data.reason || '');
      }
    } catch (err) {
      console.error('[CONTACT] error:', err);
      setContactError('Something went wrong. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  // ── Age Calculator ────────────────────────────────────────────────────────
  const birthDate = userDetails.udob;
  const age = calculateAge(birthDate);
  function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff   = today.getDate()  - birth.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) { age--; }
    return age;
  }

  // ── Send Proposal Handler ─────────────────────────────────────────────────
  const handleSendProposal = async () => {
    if (!loggedInUserId) { alert('Please login to send a proposal.'); return; }
    if (String(loggedInUserId) === String(uid)) { alert('You cannot send a proposal to your own profile.'); return; }
    setProposalStatus('sending');
    setProposalMessage('');
    try {
      const response = await sendProposal(loggedInUserId, uid);
      if (response.data.status === 'Success') {
        setProposalStatus('i_sent');
        setProposalMessage('Proposal sent successfully!');
      } else if (response.data.result === 'Proposal already sent.') {
        setProposalStatus('i_sent');
        setProposalMessage('You have already sent a proposal to this profile.');
      } else {
        setProposalStatus('error');
        setProposalMessage(response.data.result || 'Failed to send proposal.');
      }
    } catch (error) {
      console.error('[PROPOSAL] error:', error);
      setProposalStatus('error');
      setProposalMessage('Something went wrong. Please try again.');
    }
  };

  // ── Send Message Handler ──────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!loggedInUserId) { alert('Please login to send a message.'); return; }
    if (String(loggedInUserId) === String(uid)) { alert('You cannot send a message to your own profile.'); return; }
    setMessageStatus('sending');
    setMessageText('');
    const defaultMsg = `Hi ${userDetails.ufname}, I liked your profile. Let's discuss further if it matches.`;
    try {
      const response = await sendMessage(loggedInUserId, uid, defaultMsg, 'text');
      if (response.data.status === 'Success') {
        setMessageStatus('sent');
        setMessageText('Message sent successfully!');
        setMessageDate(new Date().toISOString());
      } else {
        setMessageStatus('error');
        setMessageText(response.data.result || 'Failed to send message.');
      }
    } catch (error) {
      console.error('[MESSAGE] error:', error);
      setMessageStatus('error');
      setMessageText('Something went wrong. Please try again.');
    }
  };

  // ── Proposal Helpers ──────────────────────────────────────────────────────
  const anchorLabel = () => {
    if (proposalStatus === 'sending')    return '⏳ Sending...';
    if (proposalStatus === 'i_sent')     return '✓ Proposal Sent';
    if (proposalStatus === 'i_accepted') return '✅ Proposal Accepted';
    if (proposalStatus === 'i_rejected') return '✗ Proposal Rejected';
    if (proposalStatus === 'they_sent')  return '📩 Proposal Received';
    if (proposalStatus === 'error')      return '❌ Retry Send Proposal';
    return 'Send Proposal';
  };
  // Presentation only: maps proposal status to a CSS tone modifier.
  const proposalTone = () => {
    if (proposalStatus === 'i_accepted') return 'is-accepted';
    if (proposalStatus === 'i_rejected') return 'is-rejected';
    if (proposalStatus === 'i_sent')     return 'is-sent';
    if (proposalStatus === 'they_sent')  return 'is-received';
    if (proposalStatus === 'error')      return 'is-error';
    return '';
  };
  const proposalButtonLabel = () => {
    if (proposalStatus === 'sending')    return '⏳ Sending...';
    if (proposalStatus === 'i_sent')     return '✓ Proposal Sent';
    if (proposalStatus === 'i_accepted') return '✅ Accepted';
    if (proposalStatus === 'i_rejected') return '✗ Rejected';
    if (proposalStatus === 'they_sent')  return 'Cannot Send — You Received a Proposal';
    return 'Send';
  };
  const proposalButtonDisabled =
    proposalStatus === 'sending'    || proposalStatus === 'i_sent' ||
    proposalStatus === 'i_accepted' || proposalStatus === 'i_rejected' ||
    proposalStatus === 'they_sent';
  const canOpenModal = proposalStatus === 'idle' || proposalStatus === 'error';

  // ── Message Helpers ───────────────────────────────────────────────────────
  const messageAnchorLabel = () => {
    if (messageStatus === 'sending') return '⏳ Sending...';
    if (messageStatus === 'sent')    return '✓ Message Sent';
    if (messageStatus === 'error')   return '❌ Retry';
    return 'Send Message';
  };
  // Presentation only: maps message status to a CSS tone modifier.
  const messageTone = () => {
    if (messageStatus === 'sent')  return 'is-accepted';
    if (messageStatus === 'error') return 'is-error';
    return '';
  };
  const messageButtonLabel = () => {
    if (messageStatus === 'sending') return '⏳ Sending...';
    if (messageStatus === 'sent')    return '✓ Sent';
    if (messageStatus === 'error')   return 'Retry';
    return 'Send';
  };
  const messageButtonDisabled = messageStatus === 'sending' || messageStatus === 'sent';
  const canOpenMessageModal   = messageStatus === 'idle'    || messageStatus === 'error';

  // ── Date Formatter ────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d    = new Date(dateStr);
      const dd   = String(d.getDate()).padStart(2, '0');
      const mm   = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch { return ''; }
  };

  // ── Heading Helpers ───────────────────────────────────────────────────────
  const headingText = () => {
    const date = proposalDate ? formatDate(proposalDate) : '';
    if (proposalStatus === 'i_sent')     return date ? `Proposal Sent on ${date}`        : 'Proposal Sent — Awaiting Response';
    if (proposalStatus === 'i_accepted') return date ? `✅ Proposal Accepted on ${date}` : '✅ Proposal Accepted';
    if (proposalStatus === 'i_rejected') return date ? `✗ Proposal Rejected on ${date}`  : '✗ Proposal Rejected';
    if (proposalStatus === 'they_sent')  return date ? `📩 Proposal Received on ${date}` : '📩 Proposal Received';
    return 'Profile Details';
  };
  // Presentation only: status pill classes for the heading.
  const headingClass = () => {
    if (proposalStatus === 'i_accepted') return 'pd-status is-accepted';
    if (proposalStatus === 'i_rejected') return 'pd-status is-rejected';
    if (proposalStatus === 'they_sent')  return 'pd-status is-received';
    if (proposalStatus === 'i_sent')     return 'pd-status is-sent';
    return '';
  };

  // =========================================================================
  //  RENDER
  // =========================================================================
  return (
    <>
      {/* Inner Heading */}
      <div className="inner-heading" style={{ backgroundImage: `url(${profilepics.titlebg})` }}>
        <div className="container">
          <h3 className={headingClass()}>{headingText()}</h3>
        </div>
      </div>

      {/* Inner Content */}
      <div className="inner-content pd-page">
        <div className="container">

          {/* Hero: photo + key facts */}
          <section className="pd-hero">
            <div className="pd-photo">
              <PhotoProvider>
                <PhotoView src={imageUrl(profileImage)}>
                  <img src={imageUrl(profileImage)} alt="Profile" />
                </PhotoView>
              </PhotoProvider>
            </div>
            <div className="pd-hero__info">
              <h3 className="pd-hero__name">{userDetails.ufname} Profile</h3>
              <ul className="pd-facts">
                <li><span>Profile Id </span>: MAT{userDetails.uid}</li>
                <li><span>Age </span>: {age} Years</li>
                <li><span>Height</span>: {userDetails.uheight || 'Not Available'} Feet</li>
                <li><span>Marital Status</span>: {userDetails.maritalstatus || 'Not Available'}</li>
                <li><i className="fas fa-map-marker-alt" aria-hidden="true"></i> {userDetails.upresentloc || 'Not Available'},{userDetails.ustate}</li>
              </ul>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="pd-actions">
            <ul className="pd-actions__list">
              {localStorage.getItem('isLoggedIn') === 'true' ? (
                <>
                  <li>
                    <a href="#"
                      className={`pd-action ${proposalTone()}`}
                      data-toggle={canOpenModal ? 'modal' : undefined}
                      data-target={canOpenModal ? '#sendproposal' : undefined}
                      onClick={handleSendProposal}>
                      <i className="far fa-heart" aria-hidden="true"></i> {anchorLabel()}
                    </a>
                  </li>
                  <li>
                    <a href="#"
                      className={`pd-action ${messageTone()}`}
                      data-toggle={canOpenMessageModal ? 'modal' : undefined}
                      data-target={canOpenMessageModal ? '#sendmessage' : undefined}
                      onClick={handleSendMessage}>
                      <i className="far fa-comment" aria-hidden="true"></i> {messageAnchorLabel()}
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <a href="/login" className="pd-action">
                      <i className="far fa-heart" aria-hidden="true"></i> 🔒 Login to Send Proposal
                    </a>
                  </li>
                  <li>
                    <a href="/login" className="pd-action">
                      <i className="far fa-comment" aria-hidden="true"></i> 🔒 Login to Send Message
                    </a>
                  </li>
                </>
              )}
              <li>
                <a href="#" className="pd-action" onClick={(e) => { e.preventDefault(); setShowContactDetailsModal(true); }}>
                  <i className="far fa-star" aria-hidden="true"></i> View Contact Details
                </a>
              </li>
              <li><a href="#" className="pd-action pd-action--muted"><i className="far fa-envelope" aria-hidden="true"></i> Report this profile Fake</a></li>
            </ul>
          </div>

          {/* Profile Content */}
          <div className="pd-body">
            <aside className="pd-side">
              <div className="pd-card pd-intro">
                <h4 className="pd-card__title">Introduction</h4>
                <p className="pd-intro__text">{userDetails.about || 'Not Available'}</p>
              </div>
              <div className="pd-card pd-gallery">
                <h2 className="pd-card__title">Gallery</h2>
                {gallerydata.length > 0 ? (
                  <PhotoProvider index={currentIndex} onIndexChange={setCurrentIndex}>
                    <div className="pd-gallery__grid">
                      {gallerydata.map((res, idx) => (
                        <div className="pd-gallery__cell" key={res.id}>
                          <PhotoView src={imageUrl(res.imagepath)}>
                            <div className="pd-gallery__hit" onClick={() => setCurrentIndex(idx)}>
                              <img src={imageUrl(res.imagepath)} alt="Profile Gallery" />
                              <div className="pd-gallery__zoom"><i className="fas fa-plus"></i></div>
                            </div>
                          </PhotoView>
                        </div>
                      ))}
                    </div>
                  </PhotoProvider>
                ) : (
                  <div className="pd-locked">
                    <i className="fas fa-lock" aria-hidden="true"></i>
                    <h3>Gallery Hidden</h3>
                    <p>Photos are hidden by the user. If you are interested in this profile, send a request to unlock them for you.</p>
                    <div className="pd-cta">
                      <a href="#" className="pd-btn" onClick={handleRequestPhotos}>
                        Request Photos
                      </a>
                    </div>
                  </div>
                )}
              </div>
              {!isMobile && <div className="pd-ad"><img src={profilepics.gad3} alt="" /></div>}
            </aside>

            <div className="pd-main">
              <div className="pd-tabs-wrap">
                <ul className="nav nav-tabs pd-tabs" id="usertabs" role="tablist">
                  <li className="nav-item">
                    <a className="nav-link active pd-tab" id="overview-tab" data-toggle="tab" href="#overview" role="tab">
                      About {userDetails.ufname}
                    </a>
                  </li>
                </ul>
                <div className="tab-content pd-tab-content" id="usertabsContent">
                  <div className="tab-pane fade show active" id="overview" role="tabpanel">

                    {/* General Overview */}
                    <div className="pd-info">
                      <div className="pd-info__head"><h4 className="pd-info__title">General Overview</h4></div>
                      <div className="pd-info__grid">
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">FIRST NAME</span><span className="pd-info__val pd-info__val--name">{userDetails.ufname || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">GENDER</span><span className="pd-info__val">{userDetails.ugender || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">AGE</span><span className="pd-info__val">{age}</span></li>
                          <li><span className="pd-info__key">ON BEHALF</span><span className="pd-info__val">{userDetails.ucreated || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">DATE OF BIRTH</span><span className="pd-info__val">{userDetails.udob ? (userDetails.udob).split("/")[1]+'/'+(userDetails.udob).split("/")[0]+'/'+(userDetails.udob).split("/")[2] : 'Not Available'}</span></li>
                          <li><span className="pd-info__key">PLACE OF BIRTH</span><span className="pd-info__val">{userDetails.upob || 'Not Available'}</span></li>
                        </ul>
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">LAST NAME</span><span className="pd-info__val pd-info__val--name">{userDetails.ulname || 'Not Available'}</span></li>
                          {/* <li><span className="pd-info__key">EMAIL</span><span className="pd-info__val">{userDetails.uemail || 'Not Available'}</span></li> */}
                          
                          <li><span className="pd-info__key">HEIGHT</span><span className="pd-info__val">{userDetails.uheight || 'Not Available'} Feet</span></li>
                          <li><span className="pd-info__key">MARITAL STATUS</span><span className="pd-info__val">{userDetails.maritalstatus || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">TIME OF BIRTH</span><span className="pd-info__val">{userDetails.utob || 'Not Available'}</span></li>
                        </ul>
                      </div>
                    </div>

                    {/* Horoscope */}
                    <div className="pd-info">
                      <div className="pd-info__head"><h4 className="pd-info__title">Horoscope Details</h4></div>
                      <div className="pd-info__grid">
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">Nakshtra</span><span className="pd-info__val">{userDetails.nakshtra || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">RASI</span><span className="pd-info__val">{userDetails.rasi || 'Not Available'}</span></li>
                        </ul>
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">PADAM</span><span className="pd-info__val">{userDetails.padam || 'Not Available'}</span></li>
                        </ul>
                      </div>
                    </div>

                    {/* Living at */}
                    <div className="pd-info">
                      <div className="pd-info__head"><h4 className="pd-info__title">Living at</h4></div>
                      <div className="pd-info__grid">
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">COUNTRY</span><span className="pd-info__val">{userDetails.ucountry || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">CITY</span><span className="pd-info__val">{userDetails.upresentloc || 'Not Available'}</span></li>
                        </ul>
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">STATE</span><span className="pd-info__val">{userDetails.ustate || 'Not Available'}</span></li>
                        </ul>
                      </div>
                    </div>

                    {/* Qualification */}
                    <div className="pd-info">
                      <div className="pd-info__head"><h4 className="pd-info__title">Qualification And Career</h4></div>
                      <div className="pd-info__grid">
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">HIGHEST EDUCATION</span><span className="pd-info__val">{userDetails.degree || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">ANNUAL INCOME</span><span className="pd-info__val">{userDetails.upackage || 'Not Available'}</span></li>
                        </ul>
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">OCCUPATION</span><span className="pd-info__val">{userDetails.ujob || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">JOB LOCATION</span><span className="pd-info__val">{userDetails.jobcity || 'Not Available'}</span></li>
                        </ul>
                      </div>
                    </div>

                    {/* Family Background */}
                    <div className="pd-info">
                      <div className="pd-info__head"><h4 className="pd-info__title">Family Background</h4></div>
                      <div className="pd-info__grid">
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">FATHER NAME</span><span className="pd-info__val pd-info__val--name">{userDetails.fathername || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">MOTHER NAME</span><span className="pd-info__val pd-info__val--name">{userDetails.mothername || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">BROTHERS</span><span className="pd-info__val">{userDetails.brothers || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">SISTERS</span><span className="pd-info__val">{userDetails.sisters || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">CASTE</span><span className="pd-info__val">{userDetails.ucaste || 'Not Available'}</span></li>
                        </ul>
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">FATHER OCCUPATION</span><span className="pd-info__val">{userDetails.fatheroccupation || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">MOTHER OCCUPATION</span><span className="pd-info__val">{userDetails.motheroccupation || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">BROTHERS MARRIED</span><span className="pd-info__val">{userDetails.brothersmarried || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">SISTERS MARRIED</span><span className="pd-info__val">{userDetails.sistersmarried || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">FAMILY RESIDENCE</span><span className="pd-info__val">{userDetails.familyresidence || 'Not Available'}</span></li>
                        </ul>
                      </div>
                    </div>

                    {/* Life Style */}
                    <div className="pd-info">
                      <div className="pd-info__head"><h4 className="pd-info__title">Life Style</h4></div>
                      <div className="pd-info__grid">
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">DIET</span><span className="pd-info__val">{userDetails.diet || 'Not Available'}</span></li>
                          <li><span className="pd-info__key">SMOKE</span><span className="pd-info__val">{userDetails.habitsmoke || 'Not Available'}</span></li>
                        </ul>
                        <ul className="pd-info__list">
                          <li><span className="pd-info__key">DRINK</span><span className="pd-info__val">{userDetails.habitdrink || 'Not Available'}</span></li>
                        </ul>
                      </div>
                    </div>

                    {/* Partner Preferences */}
                    <div className="pd-info">
                      <div className="pd-info__head"><h4 className="pd-info__title">Partner Preferences</h4></div>
                      <div className="pd-info__grid pd-info__grid--single">
                        <ul className="pd-info__list">
                          <li><span className="pd-info__val pd-info__val--block">{userDetails.partnerpreferences || 'Not Available'}</span></li>
                        </ul>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
          {!isMobile && <div className="pd-ad pd-ad--wide"><img src={profilepics.googleadd} alt="" /></div>}
        </div>
      </div>

      {/* ── Contact Details Modal ──────────────────────────────────────────────── */}
      {showContactDetailsModal && (
        <div className="pd-overlay" onClick={() => setShowContactDetailsModal(false)}>
          <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd-modal__head">
              <h5 className="pd-modal__title">
                <i className="far fa-address-card" aria-hidden="true"></i>
                Contact Details — {userDetails.ufname}
              </h5>
              <button type="button" onClick={() => setShowContactDetailsModal(false)} className="pd-modal__close" aria-label="Close">&times;</button>
            </div>
            <div className="pd-modal__body">

              {/* Not logged in */}
              {localStorage.getItem('isLoggedIn') !== 'true' && (
                <div className="pd-center">
                  <p className="pd-muted">Please login to view contact details.</p>
                  <div className="pd-cta"><a href="/login" className="pd-btn">Login Now</a></div>
                </div>
              )}

              {/* Logged in — before revealing */}
              {localStorage.getItem('isLoggedIn') === 'true' && !contactRevealed && (
                <>
                  <p className="pd-modal__text">
                    Viewing contact details will deduct <strong><del>₹20</del></strong> from your balance.
                    Click <strong><del>Pay Now</del></strong> to reveal the phone number and email address.
                  </p>
                  {contactError && (
                    <div className="pd-alert pd-alert--danger">
                      <i className="fas fa-times-circle"></i>
                      {contactError}
                      {/* Hidden-contact rule: one-tap link to fix it in Profile Security */}
                      {contactErrorReason === 'contact_hidden' && (
                        <div className="pd-alert__action">
                          <a
                            href="/profilesecurity"
                            onClick={(e) => { e.preventDefault(); setShowContactDetailsModal(false); navigate('/profilesecurity'); }}
                            className="pd-btn pd-btn--sm"
                          >
                            <i className="fas fa-shield-alt"></i> Go to Profile Security
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="pd-cta">
                    <a href="#"
                      onClick={(e) => { e.preventDefault(); handleRevealContact(); }}
                      className={`pd-btn pd-btn--unlock${contactLoading ? ' is-loading' : ''}`}>
                      {contactLoading ? '⏳ Loading...' : '💳 Unlock Contact (Free)'}
                    </a>
                  </div>
                </>
              )}

              {/* Logged in — after revealing */}
              {localStorage.getItem('isLoggedIn') === 'true' && contactRevealed && contactInfo && (
                <>
                  <div className="pd-alert pd-alert--success">
                    <i className="far fa-check-circle"></i>
                    Contact details revealed.
                  </div>
                  <div className="pd-contact">
                    <h6 className="pd-contact__title">
                      <i className="far fa-user"></i>
                      {userDetails.ufname} {userDetails.ulname} — Contact Information
                    </h6>

                    {/* Phone */}
                    <div className="pd-contact__row">
                      <div className="pd-contact__icon pd-contact__icon--phone">
                        <i className="fas fa-phone"></i>
                      </div>
                      <div className="pd-contact__text">
                        <div className="pd-contact__label">PHONE NUMBER</div>
                        <div className="pd-contact__value">
                          {contactInfo.uphone
                            ? contactInfo.uphone
                            : <em className="pd-contact__hidden">Mobile number is hidden by user</em>
                          }
                        </div>
                      </div>
                      {contactInfo.uphone && (
                        <a href={`tel:${contactInfo.uphone}`} className="pd-chip pd-chip--phone">
                          Call Now
                        </a>
                      )}
                    </div>

                    {/* Email */}
                    <div className="pd-contact__row">
                      <div className="pd-contact__icon pd-contact__icon--email">
                        <i className="far fa-envelope"></i>
                      </div>
                      <div className="pd-contact__text">
                        <div className="pd-contact__label">EMAIL ADDRESS</div>
                        <div className="pd-contact__value">
                          {contactInfo.uemail
                            ? contactInfo.uemail
                            : <em className="pd-contact__hidden">Email is hidden by user</em>
                          }
                        </div>
                      </div>
                      {contactInfo.uemail && (
                        <a href={`mailto:${contactInfo.uemail}`} className="pd-chip pd-chip--email">
                          Email Now
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="pd-modal__foot">
                    <button
                      type="button"
                      onClick={() => setShowContactDetailsModal(false)}
                      className="pd-close-btn">
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Send Proposal Modal ───────────────────────────────────────────────── */}
      <div className="modal fade pd-bs-modal" id="sendproposal" tabIndex="-1" role="dialog" aria-labelledby="proposalLabel" aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="proposalLabel">Send Proposal to {userDetails.ufname}</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            </div>
            <div className="modal-body">
              <div className="pd-modal-inner">
                {proposalStatus === 'they_sent' && (
                  <div className="pd-alert pd-alert--info">
                    <i className="fas fa-info-circle"></i>
                    {userDetails.ufname} has already sent you a proposal. Please accept or reject it from your notification bell 🔔.
                  </div>
                )}
                {proposalStatus === 'i_sent' && proposalMessage === 'Proposal sent successfully!' && (
                  <div className="pd-alert pd-alert--success">
                    <i className="far fa-check-circle"></i>
                    Proposal sent successfully to {userDetails.ufname}! Waiting for response.
                  </div>
                )}
                {proposalStatus === 'i_sent' && proposalMessage !== 'Proposal sent successfully!' && (
                  <div className="pd-alert pd-alert--warn">
                    <i className="fas fa-clock"></i>
                    Your proposal is pending. Waiting for {userDetails.ufname} to respond.
                  </div>
                )}
                {proposalStatus === 'i_accepted' && (
                  <div className="pd-alert pd-alert--success">
                    <i className="far fa-check-circle"></i>
                    🎉 {userDetails.ufname} has accepted your proposal!
                  </div>
                )}
                {proposalStatus === 'i_rejected' && (
                  <div className="pd-alert pd-alert--danger">
                    <i className="fas fa-times-circle"></i>
                    {userDetails.ufname} has rejected your proposal.
                  </div>
                )}
                {proposalStatus === 'error' && (
                  <div className="pd-alert pd-alert--danger">
                    <i className="fas fa-times-circle"></i>
                    {proposalMessage}
                  </div>
                )}
                {(proposalStatus === 'idle' || proposalStatus === 'sending') && (
                  <p className="pd-modal-text">Sending Proposal will deduct <strong>1 credit</strong> from your package.</p>
                )}
                <div className="pd-modal-foot">
                  <input type="button" value={proposalButtonLabel()} className="btn pd-send-btn"
                    onClick={handleSendProposal} disabled={proposalButtonDisabled} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Send Message Modal ────────────────────────────────────────────────── */}
      <div className="modal fade pd-bs-modal" id="sendmessage" tabIndex="-1" role="dialog" aria-labelledby="messageLabel" aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="messageLabel">Send Message to {userDetails.ufname}</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            </div>
            <div className="modal-body">
              <div className="pd-modal-inner">
                {messageStatus === 'sent' && (
                  <div className="pd-alert pd-alert--success">
                    <i className="far fa-check-circle"></i>
                    Message sent successfully to {userDetails.ufname}!
                  </div>
                )}
                {messageStatus === 'error' && messageText && (
                  <div className="pd-alert pd-alert--danger">
                    <i className="fas fa-times-circle"></i>
                    {messageText}
                  </div>
                )}
                {(messageStatus === 'idle' || messageStatus === 'sending') && (
                  <>
                    <p className="pd-modal-text">Sending Message will deduct <strong>1 credit</strong> from your package.</p>
                    <div className="pd-preview">
                      <strong className="pd-preview__label">
                        <i className="far fa-comment-alt"></i>
                        Message Preview:
                      </strong>
                      Hi {userDetails.ufname}, I liked your profile. Let's discuss further if it matches.
                    </div>
                  </>
                )}
                <div className="pd-modal-foot">
                  <input type="button" value={messageButtonLabel()} className="btn pd-send-btn"
                    onClick={handleSendMessage} disabled={messageButtonDisabled} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileDetails;
