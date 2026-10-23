 
const jwt = require('jsonwebtoken');
require('dotenv').config();

// ─── Token Helpers ────────────────────────────────────────────────────────────
exports.generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: '15m' });
};

exports.generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

// ─── Cookie Options ───────────────────────────────────────────────────────────
// HttpOnly: true  → JS cannot read this cookie (XSS safe — like Facebook/Instagram)
// Secure: true    → only sent over HTTPS in production
// SameSite: strict → CSRF safe
exports.accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000           // 15 minutes
};

exports.refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
};

// ─── Middleware: Protect Routes ───────────────────────────────────────────────
// Reads token from HttpOnly cookie ONLY (like Facebook/Instagram)
// No Authorization header needed — browser sends cookie automatically
exports.authenticateToken = (req, res, next) => {
  // Read accessToken from HttpOnly cookie — browser sends this automatically
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({
      status: 'Failure',
      result: 'Access token missing. Please login.'
    });
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        status: 'Failure',
        result: 'Access token expired or invalid.'
      });
    }
    req.user = user; // { uid, uemail, ugender }
    next();
  });
};

// ─── Refresh Access Token ─────────────────────────────────────────────────────
// POST /api/refresh
// Browser sends refreshToken cookie automatically (HttpOnly)
// Returns new accessToken as HttpOnly cookie — no token in response body
exports.refresh = (req, res) => {
  // Read refreshToken from HttpOnly cookie only
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      status: 'Failure',
      result: 'No refresh token. Please login again.'
    });
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      // Refresh token expired — force re-login
      res.clearCookie('accessToken',  { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
      res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
      return res.status(403).json({
        status: 'Failure',
        result: 'Session expired. Please login again.'
      });
    }

    // Issue new accessToken as HttpOnly cookie
    const { generateAccessToken, accessCookieOptions } = require('./tokenController');
    const newAccessToken = generateAccessToken({
      uid:     user.uid,
      uemail:  user.uemail,
      ugender: user.ugender
    });

    // Set new accessToken as HttpOnly cookie — JS cannot read this
    res.cookie('accessToken', newAccessToken, accessCookieOptions);

    // Return success — no token in body (browser handles cookie automatically)
    return res.status(200).json({
      status: 'Success',
      result: 'Token refreshed.'
      // NO accessToken in body — cookie only (like Facebook/Instagram)
    });
  });
};

// ─── Logout ───────────────────────────────────────────────────────────────────
// POST /api/logout
// Clears both HttpOnly cookies — user is fully logged out
exports.logout = (req, res) => {
  res.clearCookie('accessToken',  { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
  return res.status(200).json({
    status: 'Success',
    result: 'Logged out successfully.'
  });
};