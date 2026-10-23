// routes/adminRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// The /api/adminhub router. POST /login is public; everything else is behind
// requireAdmin (reads/verifies the adminToken cookie).
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();

const requireAdmin = require('../middleware/requireAdmin');
const adminController = require('../controllers/adminController');

// Public
router.post('/login', adminController.login);

// Protected
router.post('/logout', requireAdmin, adminController.logout);
router.get('/me', requireAdmin, adminController.me);
router.get('/dashboard', requireAdmin, adminController.dashboard);
router.get('/users', requireAdmin, adminController.users);
router.post('/users/status', requireAdmin, adminController.setUserStatus);
router.post('/users/profilestatus', requireAdmin, adminController.setProfileStatus);
router.delete('/users/:uid', requireAdmin, adminController.deleteUser);
router.get('/photos', requireAdmin, adminController.photos);
router.post('/photos/status', requireAdmin, adminController.setPhotoStatus);
router.get('/messageslist', requireAdmin, adminController.messageslist);
router.post('/impersonate', requireAdmin, adminController.impersonate);

module.exports = router;
