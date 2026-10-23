// src/services/listingService.js
//
// NOTE (security hardening): /getAllUsers, /getPublicProfile and /GetUserGallery
// now require authentication on the backend (they previously leaked the member
// directory and private galleries to anonymous callers, bypassing the hide_*
// privacy flags). All calls therefore go through the shared credentialed `api`
// instance, which sends the HttpOnly auth cookie and runs the 401 -> refresh ->
// retry interceptor. For a genuinely logged-out visitor these endpoints return
// 401 and the interceptor redirects to /login, which is the intended behavior
// now that the data is protected.
//
// The getPublicProfile / getPublicGallery names are kept for backward
// compatibility with existing imports (e.g. ProfileDetails.js); they no longer
// use a credential-less client.
import api from '../utils/api';

// GET /api/getAllUsers (auth required)
export const getAllUsers = async (page, limit, gender = null) => {
  const genderQuery = gender ? `&gender=${encodeURIComponent(gender)}` : '';
  return await api.get(`/getAllUsers?page=${page}&limit=${limit}${genderQuery}`);
};

// POST /api/getPublicProfile (auth required)
export const getPublicProfile = async (uid) => {
  return await api.post('/getPublicProfile', { uid });
};

// POST /api/Fetchlistdata (auth required)
export const searchUsers = async (filters, page, limit) => {
  return await api.post('/Fetchlistdata', { ...filters, page, limit });
};

// POST /api/GetUserGallery (auth required)
export const getUserGallery = async (uid) => {
  return await api.post('/GetUserGallery', { uid });
};

// Backward-compatible alias — kept so existing imports keep working.
// Routes through the credentialed instance like every other call above.
export const getPublicGallery = async (uid) => {
  return await api.post('/GetUserGallery', { uid });
};
