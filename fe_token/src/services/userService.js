 

import api from '../utils/api';

// GET /api/getAllUsers?page=1&limit=10&gender=Female
export const getAllUsers = async (page, limit, gender = null) => {
  const genderQuery = gender ? `&gender=${encodeURIComponent(gender)}` : '';
  return await api.get(`/getAllUsers?page=${page}&limit=${limit}${genderQuery}`);
};

// POST /api/getUserById   body: { id }
export const getUserById = async (id) => {
  return await api.post('/getUserById', { id });
};

// POST /api/FetchUserDetails   body: { uid }
export const fetchUserDetails = async (userId) => {
  return await api.post('/FetchUserDetails', { uid: userId });
};

// POST /api/GetUserGallery   body: { uid }
export const fetchUserGallery = async (userId) => {
  return await api.post('/GetUserGallery', { uid: userId });
};

// POST /api/updateUserRecords   body: { uid, about, fatherName, ... }
export const updateUserRecords = async (formData) => {
  return await api.post('/updateUserRecords', formData);
};

// POST /api/UpdateUserRegistrationDetails   body: { uid, pob, city, ... }
export const updateUserRegistrationDetails = async (formData) => {
  return await api.post('/UpdateUserRegistrationDetails', formData);
};

// POST /api/uploadUserGallery   body: { gallery: [...] }
export const uploadUserGallery = async (formData) => {
  return await api.post('/uploadUserGallery', formData);
};

// POST /api/UpdateProfileStatus   body: { id }
export const updateProfileStatus = async (imageId) => {
  return await api.post('/UpdateProfileStatus', { id: imageId });
};

// POST /api/deleteGalleryRecord   body: { id }
// export const deleteGalleryRecord = async (id) => {
//   return await api.post('/deleteGalleryRecord', { id });
// };// updated code for delete gallery by id
export const deleteGalleryRecord = async (galleryId, userId) => {
  return await api.post('/deleteGalleryRecord', { 
    id: galleryId,      // ✅ Gallery record ID (from usergallery.id)
    user_id: userId     // ✅ Logged-in user ID for ownership verification
  });
};

// POST /api/getUserRecords   (no body needed — backend reads from token)
export const getUserRecords = async () => {
  return await api.post('/getUserRecords');
};
// ─── Get Contact Info (phone + email) ────────────────────────────────────────
// POST /api/getContactInfo   body: { uid }
// Protected — HttpOnly cookie sent automatically by browser
// Exposed route: /getContactInfo
// Internal function: getUserMobile in dbController.js (hidden)
export const getUserContactInfo = async (uid) => {
  return await api.post('/getContactInfo', { uid: Number(uid) });
};

// POST /api/changePassword
export const changePassword = async (currentPassword, newPassword) => {
  return await api.post('/changePassword', { currentPassword, newPassword });
};

// POST /api/closeAccount
export const closeAccount = async () => {
  return await api.post('/closeAccount');
};
// ─────────────────────────────────────────────────────────────────────────────
// ADD to src/services/userService.js
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/getPrivacySettings  (uid from cookie — no body needed)
export const getPrivacySettings = async () => {
  return await api.get('/getPrivacySettings');
};

// POST /api/updatePrivacySettings
// body: { hide_email, hide_phone, hide_gallery, hide_picture }
export const updatePrivacySettings = async (hide_email, hide_phone, hide_gallery, hide_picture) => {
  return await api.post('/updatePrivacySettings', {
    hide_email,
    hide_phone,
    hide_gallery,
    hide_picture
  });
};