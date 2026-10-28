// Base URL for every API call (user + admin axios instances, EditProfile).
// 1. REACT_APP_API_BASE_URL wins when it is set (.env, docker build arg).
// 2. Local development falls back to the backend on port 9012, so a missing
//    or stale env value can't send POSTs to the React dev server (404).
// 3. Production falls back to a same-origin /api path.
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'https://telugusambandham.com/api'
    : '/api');
