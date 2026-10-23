// middleware/requireAdmin.js
// ─────────────────────────────────────────────────────────────────────────────
// Admin auth middleware — strictly separate from the user-side authenticateToken.
// Reads the HttpOnly `adminToken` cookie and verifies it against the ADMIN secret
// ONLY. A user accessToken can never satisfy this (different key space), and an
// adminToken can never satisfy the user middleware.
// ─────────────────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');

// Admin token secret: explicit env var, else a derived fallback that is still a
// DIFFERENT key space from the user TOKEN_SECRET. The fallback suffix is fixed.
const adminSecret = () =>
  process.env.ADMIN_TOKEN_SECRET || (process.env.TOKEN_SECRET + '_admin_v1');

module.exports = function requireAdmin(req, res, next) {
  const token = req.cookies?.adminToken;

  if (!token) {
    return res.status(401).json({ status: 'Failure', result: 'Admin auth required.' });
  }

  jwt.verify(token, adminSecret(), (err, decoded) => {
    if (err) {
      return res.status(401).json({ status: 'Failure', result: 'Admin auth required.' });
    }
    req.admin = { adminId: decoded.adminId, email: decoded.email, role: decoded.role };
    next();
  });
};
