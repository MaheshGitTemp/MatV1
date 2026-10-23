// src/components/admin/adminApi.js
//
// Dedicated axios instance for the ADMIN side. Intentionally SEPARATE from
// utils/api.js: that user instance has a 401 response interceptor that redirects
// to the USER /login (and silently refreshes user cookies). The admin panel must
// NOT inherit that behavior — an admin 401 should surface to the calling
// component so it can send the admin to /adminhub/matrimony/login instead.
//
// There is deliberately NO response interceptor here. A 401 simply rejects and
// the caller (AdminProtectedRoute / each page) decides what to do.
//
// baseURL is the SAME /api base as the user instance (process.env.REACT_APP_API_BASE_URL).
// Call paths carry the namespace, e.g. adminApi.post('/adminhub/login', ...),
// so no string surgery on the base is needed.

import axios from 'axios';

const adminApi = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true, // sends/receives the HttpOnly adminToken cookie
});

export default adminApi;
