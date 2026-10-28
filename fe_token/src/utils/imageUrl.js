
// src/utils/imageUrl.js
//const BASE = process.env.REACT_APP_API_BASE_URL?.replace('/api', '')
  //           || 'http://localhost:9012';
 const BASE = process.env.REACT_APP_API_BASE_URL?.replace('/api', '')
              || 'https://telugusambandham.com';

export const imageUrl = (path) => {
  if (!path) return null;

  // ✅ Already a full URL — return as-is
  if (path.startsWith('http')) return path;

  // ✅ Base64 — return as-is
  if (path.startsWith('data:')) return path;

  // ✅ Local webpack asset (starts with /static/ or is a blob)
  // These come from import statements like: import notfound from '...'
  // Webpack gives them paths like /static/media/notfound.abc123.png
  if (path.startsWith('/static/') || path.startsWith('blob:')) return path;

  // ✅ Relative backend path — prepend backend base URL
  // e.g. /uploads/gallery/user_7_timestamp_original.jpg
  return `${BASE}${path}`;
};

// ─── Approval status helpers ─────────────────────────────────────────────────
// Images now carry a `status` of 'pending' | 'approved' | 'rejected'. Only
// approved images may be shown to viewers. The backend already filters most
// cross-user responses, but a gallery owner receives ALL their own rows
// (incl. pending/rejected) from GetUserGallery — so the frontend must guard
// display surfaces too. These helpers centralize that rule.
//
// Note: records returned before the approval feature existed may have no
// `status` field at all. Such legacy rows were grandfathered to 'approved' in
// the DB, so a missing status is treated as approved for safety of display.

export const isApproved = (img) =>
  !!img && (img.status === undefined || img.status === null || img.status === 'approved');

// Keep only approved images from a gallery array.
export const approvedOnly = (gallery) =>
  Array.isArray(gallery) ? gallery.filter(isApproved) : [];

// Find the APPROVED profile image in a gallery array (the one flagged
// isprofile). Returns undefined if the profile image isn't approved yet.
export const approvedProfileImage = (gallery) =>
  Array.isArray(gallery)
    ? gallery.find((img) => img.isprofile === true && isApproved(img))
    : undefined;
