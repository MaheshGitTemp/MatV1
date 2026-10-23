const express            = require('express');
const router             = express.Router();
const myController       = require('../controllers/tokenController');
const mydbController     = require('../controllers/dbController');
const proposalController = require('../controllers/proposalController');
const chatController     = require('../controllers/chatController');
const otpController = require('../controllers/otpController');

// ─── Middleware ───────────────────────────────────────────────────────────────
const auth = myController.authenticateToken;

// ─── OTP Routes (Public) ──────────────────────────────────────────────────────
router.post('/sendOtp',   otpController.sendOtp);
router.post('/verifyOtp', otpController.verifyOtp);
// ─── Forgot Password (Public — no auth) ──────────────────────────────────────
router.post('/resetPassword', mydbController.resetPassword); // ← add this
// ─── Auth (Public) ────────────────────────────────────────────────────────────
router.post('/login',    mydbController.login);
router.post('/register', mydbController.register);
router.post('/refresh',  myController.refresh);
router.post('/logout',   myController.logout);
// Impersonation exchange (shadow login) — PUBLIC, token-gated. Mints USER cookies
// from a single-use admin-issued token, so it lives on the user router (no auth).
router.post('/impersonate/exchange', mydbController.impersonateExchange);

// ─── Protected User APIs ──────────────────────────────────────────────────────
router.get('/getAllUsers',       auth, mydbController.getAllUsers);
router.post('/getPublicProfile', auth, mydbController.getPublicProfile);
router.post('/getUserById',                   auth, mydbController.getUserById);
router.post('/uploadUserGallery',             auth, mydbController.uploadProfileImages);
router.post('/deleteGalleryRecord',           auth, mydbController.DeleteUserGalleryRecord);
router.post('/updateUserRecords',             auth, mydbController.updateUserRecords);
router.post('/GetUserGallery',                auth, mydbController.GetUserGallery);
router.post('/FetchUserDetails',              auth, mydbController.FetchAllUserDetails);
router.post('/Fetchlistdata',                 auth, mydbController.Fetchlistdata);
router.post('/getUserRecords',                auth, mydbController.getUserRecords);
router.post('/UpdateUserRegistrationDetails', auth, mydbController.UpdateUserRegistrationDetails);
router.post('/UpdateProfileStatus',           auth, mydbController.updateUserProfileStatus);

// ─── Protected Proposal & Notification APIs ───────────────────────────────────
router.post('/sendProposal',                auth, proposalController.sendProposal);
router.post('/getNotifications',            auth, proposalController.getNotifications);
router.post('/acceptProposal',              auth, proposalController.acceptProposal);
router.post('/rejectProposal',              auth, proposalController.rejectProposal);
router.post('/markNotificationsRead',       auth, proposalController.markNotificationsRead);
router.post('/getUnreadCount',              auth, proposalController.getUnreadCount);
router.post('/getSentProposals',            auth, proposalController.getSentProposals);
router.post('/getSenderNotifications',      auth, proposalController.getSenderNotifications);
router.post('/markSenderNotificationsRead', auth, proposalController.markSenderNotificationsRead);

// ─── Protected Chat APIs ──────────────────────────────────────────────────────
router.post('/sendMessage',           auth, chatController.sendMessage);
router.post('/getMessages',           auth, chatController.getMessages);
router.post('/getInbox',              auth, chatController.getInbox);
router.post('/getUnreadMessageCount', auth, chatController.getUnreadMessageCount);
router.post('/markMessagesRead',      auth, chatController.markMessagesRead);
router.post('/deleteMessage',         auth, chatController.deleteMessage);
router.post('/getConversation',       auth, chatController.getConversation);
// ─── Disguised route — public name hides real endpoint ───────────────────────
// Exposed:  POST /api/getContactInfo   ← user sees this
// Internal: runs getUserMobile logic   ← real function, hidden
router.post('/getContactInfo', auth, mydbController.getUserMobile);

// Original route — REMOVE or COMMENT OUT so it's not directly accessible
// router.post('/getUserMobile', auth, mydbController.getUserMobile); ← remove this
router.post('/changePassword', auth, mydbController.changePassword);
router.post('/closeAccount', auth, mydbController.closeAccount);
// ─────────────────────────────────────────────────────────────────────────────
// ADD to routes/index.js — Protected User APIs section
// ─────────────────────────────────────────────────────────────────────────────

router.get('/getPrivacySettings',     auth, mydbController.getPrivacySettings);
router.post('/updatePrivacySettings', auth, mydbController.updatePrivacySettings);
module.exports = router;