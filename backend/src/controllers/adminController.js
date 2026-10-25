// controllers/adminController.js
// ─────────────────────────────────────────────────────────────────────────────
// All /api/adminhub handlers. Request-boundary validation lives here (whitelists,
// uid parsing, search normalization). Expected business outcomes return HTTP 200
// with {status:'Success'|'Failure'}; only unexpected server errors return 500.
// The adminToken cookie is signed with the ADMIN secret (separate key space).
// ─────────────────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');
const adminService = require('../services/adminService');
const { verifyPassword } = require('../services/passwordfunction');

const MAT_RE = /^MAT\s*0*(\d+)$/i;

const adminSecret = () =>
  process.env.ADMIN_TOKEN_SECRET || (process.env.TOKEN_SECRET + '_admin_v1');

const adminCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 8 * 60 * 60 * 1000 // 8 hours
});

// Build ONE whereSql + params from a search string, shared by data & count.
// Column alias `a` matches both the users list (FROM users a) usage; the photos
// list passes its own prefix via `col`.
function buildUserWhere(search) {
  if (!search) return { whereSql: '', params: [] };
  const matMatch = search.match(MAT_RE);
  if (matMatch) {
    return { whereSql: 'WHERE a.uid = $1', params: [parseInt(matMatch[1], 10)] };
  }
  if (/^\d+$/.test(search)) {
    return { whereSql: 'WHERE a.uid = $1', params: [parseInt(search, 10)] };
  }
  return {
    whereSql:
      `WHERE (a.ufname ILIKE '%'||$1||'%' OR a.ulname ILIKE '%'||$1||'%' ` +
      `OR concat_ws(' ', a.ufname, a.ulname) ILIKE '%'||$1||'%')`,
    params: [search]
  };
}

// Photos search is MAT-id / numeric only (by owner uid).
function buildPhotoWhere(search) {
  if (!search) return { whereSql: '', params: [] };
  const matMatch = search.match(MAT_RE);
  if (matMatch) {
    return { whereSql: 'WHERE g.uid = $1', params: [parseInt(matMatch[1], 10)] };
  }
  if (/^\d+$/.test(search)) {
    return { whereSql: 'WHERE g.uid = $1', params: [parseInt(search, 10)] };
  }
  return { whereSql: '', params: [] };
}

function parsePaging(req) {
  let page = parseInt(req.query.page, 10);
  let limit = parseInt(req.query.limit, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit)) limit = 20;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;
  return { page, limit };
}

function normalizeSearch(req) {
  let s = req.query.search;
  if (typeof s !== 'string') return '';
  s = s.trim();
  if (s.length > 100) s = s.slice(0, 100);
  return s;
}

function parseUid(value) {
  const uid = parseInt(value, 10);
  if (!Number.isFinite(uid) || uid <= 0) return null;
  return uid;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const identifierRaw = req.body?.identifier;
    const password = req.body?.password;
    const identifier = typeof identifierRaw === 'string' ? identifierRaw.trim() : '';

    if (!identifier || identifier.length > 255 ||
        typeof password !== 'string' || password.length < 1 || password.length > 200) {
      return res.status(200).json({ status: 'Failure', result: 'Invalid credentials.' });
    }

    const admin = await adminService.findAdminByIdentifier(identifier);
    if (!admin) {
      return res.status(200).json({ status: 'Failure', result: 'Invalid credentials.' });
    }

    const result = await verifyPassword(password, admin.password);
    if (!result.ok) {
      return res.status(200).json({ status: 'Failure', result: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: admin.role },
      adminSecret(),
      { expiresIn: '8h' }
    );
    res.cookie('adminToken', token, adminCookieOptions());

    await adminService.writeAudit({ adminId: admin.id, action: 'login', targetUid: null, details: null });

    return res.status(200).json({
      status: 'Success',
      data: {
        adminId: admin.id,
        email: admin.email,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('adminController.login error:', err.message);
    return res.status(500).json({ status: 'Failure', result: 'Server error.' });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie('adminToken', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    await adminService.writeAudit({ adminId: req.admin?.adminId, action: 'logout', targetUid: null, details: null });
    return res.status(200).json({ status: 'Success', result: 'Logged out.' });
  } catch (err) {
    console.error('adminController.logout error:', err.message);
    return res.status(500).json({ status: 'Failure', result: 'Server error.' });
  }
};

exports.me = (req, res) => {
  return res.status(200).json({ status: 'Success', data: req.admin });
};

// ── Dashboard ───────────────────────────────────────────────────────────────
exports.dashboard = async (req, res) => {
  try {
    const data = await adminService.getDashboard();
    return res.status(200).json({ status: 'Success', data });
  } catch (err) {
    console.error('adminController.dashboard error:', err.message);
    return res.status(500).json({ status: 'Failure', result: 'Server error.' });
  }
};

// ── Users ──────────────────────────────────────────────────────────────────
exports.users = async (req, res) => {
  try {
    const { page, limit } = parsePaging(req);
    const search = normalizeSearch(req);
    const { whereSql, params } = buildUserWhere(search);
    const { rows, total } = await adminService.listUsers({ page, limit, whereSql, params });
    return res.status(200).json({ status: 'Success', data: { rows, total, page, limit } });
  } catch (err) {
    console.error('adminController.users error:', err.message);
    return res.status(500).json({ status: 'Failure', result: 'Server error.' });
  }
};

const ACCOUNT_STATUSES = ['Pending', 'Active', 'Closed', 'Blocked'];
const PROFILE_STATUSES = ['pending', 'approved', 'rejected'];
const PHOTO_STATUSES = ['approved', 'rejected', 'pending'];

exports.setUserStatus = async (req, res) => {
  try {
    const uid = parseUid(req.body?.uid);
    const status = req.body?.status;
    if (!uid) return res.status(200).json({ status: 'Failure', result: 'Invalid uid.' });
    if (!ACCOUNT_STATUSES.includes(status)) {
      return res.status(200).json({ status: 'Failure', result: 'Invalid status.' });
    }
    const updated = await adminService.setUserStatus(uid, status);
    if (!updated) return res.status(200).json({ status: 'Failure', result: 'User not found.' });
    await adminService.writeAudit({
      adminId: req.admin?.adminId, action: 'set_user_status', targetUid: uid, details: { status }
    });
    return res.status(200).json({ status: 'Success', data: updated });
  } catch (err) {
    console.error('adminController.setUserStatus error:', err.message);
    return res.status(500).json({ status: 'Failure', result: 'Server error.' });
  }
};

exports.setProfileStatus = async (req, res) => {
  try {
    const uid = parseUid(req.body?.uid);
    const profileStatus = req.body?.profile_status;
    if (!uid) return res.status(200).json({ status: 'Failure', result: 'Invalid uid.' });
    if (!PROFILE_STATUSES.includes(profileStatus)) {
      return res.status(200).json({ status: 'Failure', result: 'Invalid profile_status.' });
    }
    const updated = await adminService.setProfileStatus(uid, profileStatus);
    if (!updated) return res.status(200).json({ status: 'Failure', result: 'User not found.' });
    await adminService.writeAudit({
      adminId: req.admin?.adminId, action: 'set_profile_status', targetUid: uid, details: { profile_status: profileStatus }
    });
    return res.status(200).json({ status: 'Success', data: updated });
  } catch (err) {
    console.error('adminController.setProfileStatus error:', err.message);
    return res.status(500).json({ status: 'Failure', result: 'Server error.' });
  }
};

exports.deleteUser = async (req, res) => {
  const uid = parseUid(req.params?.uid);
  if (!uid) return res.status(200).json({ status: 'Failure', result: 'Invalid uid.' });
  try {
    const result = await adminService.deleteUserCascade(uid, req.admin?.adminId);
    return res.status(200).json({ status: 'Success', data: result });
  } catch (err) {
    console.error(`adminController.deleteUser error (uid ${uid}):`, err.message);
    return res.status(500).json({ status: 'Failure', result: 'Delete failed, no changes applied.' });
  }
};

// ── Photos ──────────────────────────────────────────────────────────────────
exports.photos = async (req, res) => {
  try {
    const { page, limit } = parsePaging(req);
    const search = normalizeSearch(req);
    const { whereSql, params } = buildPhotoWhere(search);
    const { rows, total } = await adminService.listPhotos({ page, limit, whereSql, params });
    return res.status(200).json({ status: 'Success', data: { rows, total, page, limit } });
  } catch (err) {
    console.error('adminController.photos error:', err.message);
    return res.status(500).json({ status: 'Failure', result: 'Server error.' });
  }
};

exports.setPhotoStatus = async (req, res) => {
  try {
    const id = parseUid(req.body?.id);
    const status = req.body?.status;
    if (!id) return res.status(200).json({ status: 'Failure', result: 'Invalid id.' });
    if (!PHOTO_STATUSES.includes(status)) {
      return res.status(200).json({ status: 'Failure', result: 'Invalid status.' });
    }
    const updated = await adminService.setPhotoStatus(id, status);
    if (!updated) return res.status(200).json({ status: 'Failure', result: 'Photo not found.' });
    await adminService.writeAudit({
      adminId: req.admin?.adminId, action: 'set_photo_status', targetUid: null, details: { id, status }
    });
    return res.status(200).json({ status: 'Success', data: updated });
  } catch (err) {
    console.error('adminController.setPhotoStatus error:', err.message);
    return res.status(500).json({ status: 'Failure', result: 'Server error.' });
  }
};

// ── Flagged senders ───────────────────────────────────────────────────────────
exports.messageslist = async (req, res) => {
  try {
    const { page, limit } = parsePaging(req);
    const { rows, total } = await adminService.listFlaggedSenders({ page, limit });
    return res.status(200).json({ status: 'Success', data: { rows, total, page, limit } });
  } catch (err) {
    console.error('adminController.messageslist error:', err.message);
    return res.status(500).json({ status: 'Failure', result: 'Server error.' });
  }
};

// ── Contact-view limit setting ──────────────────────────────────────────────
exports.getContactLimit = async (req, res) => {
  try {
    const limit = await adminService.getContactViewLimit();
    return res.status(200).json({ status: 'Success', data: { daily_contact_view_limit: limit } });
  } catch (err) {
    console.error('adminController.getContactLimit error:', err.message);
    return res.status(500).json({ status: 'Failure', result: 'Server error.' });
  }
};

exports.setContactLimit = async (req, res) => {
  try {
    const raw = req.body?.limit ?? req.body?.daily_contact_view_limit;
    const limit = Number(raw);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(200).json({ status: 'Failure', result: 'Limit must be an integer between 1 and 100.' });
    }
    const saved = await adminService.setContactViewLimit(limit);
    await adminService.writeAudit({
      adminId: req.admin?.adminId, action: 'set_contact_limit', targetUid: null, details: { limit: saved }
    });
    return res.status(200).json({ status: 'Success', data: { daily_contact_view_limit: saved } });
  } catch (err) {
    console.error('adminController.setContactLimit error:', err.message);
    return res.status(500).json({ status: 'Failure', result: 'Server error.' });
  }
};

// ── Impersonation ─────────────────────────────────────────────────────────────
exports.impersonate = async (req, res) => {
  try {
    const uid = parseUid(req.body?.uid);
    if (!uid) return res.status(200).json({ status: 'Failure', result: 'Invalid uid.' });
    const token = await adminService.createImpersonationToken(uid, req.admin?.adminId);
    await adminService.writeAudit({
      adminId: req.admin?.adminId, action: 'impersonate', targetUid: uid, details: null
    });
    return res.status(200).json({ status: 'Success', data: { token } });
  } catch (err) {
    console.error('adminController.impersonate error:', err.message);
    return res.status(500).json({ status: 'Failure', result: 'Server error.' });
  }
};
