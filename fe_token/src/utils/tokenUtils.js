 

export const tokenUtils = {

  // ── Save user info after login (NO tokens) ────────────────────────────────
  // Tokens are in HttpOnly cookies set by the server — we only save UI state
  setUserInfo: (userId, userGender) => {
    localStorage.setItem('userId',     String(userId));
    localStorage.setItem('userGender', userGender || '');
    localStorage.setItem('isLoggedIn', 'true');
  },

  // ── Read UI state ─────────────────────────────────────────────────────────
  getUserId:    () => localStorage.getItem('userId'),
  getUserGender: () => localStorage.getItem('userGender'),
  isLoggedIn:   () => localStorage.getItem('isLoggedIn') === 'true',

  // ── Clear UI state on logout ──────────────────────────────────────────────
  // Actual cookie clearing happens server-side via POST /logout
  clearUserInfo: () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userGender');
    localStorage.setItem('isLoggedIn', 'false');
  }
};