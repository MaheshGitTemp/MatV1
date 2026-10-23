
import React, { createContext, useState, useEffect } from 'react';
import { loginUser, logoutUser } from '../../services/authService';
import api from '../../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [loginuser, setLoginuser] = useState(
    localStorage.getItem('userId') || null
  );
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('isLoggedIn') === 'true'
  );
// ── Sync auth state across tabs ───────────────────────────────────────────
// When Tab 1 logs in/out → localStorage changes → Tab 2 receives storage event
// Tab 2 updates its React state automatically — no refresh needed
useEffect(() => {
  const handleStorageChange = (event) => {
    // Only react to isLoggedIn key changes
    if (event.key === 'isLoggedIn') {
      const newValue = event.newValue === 'true';

      if (newValue) {
        // Another tab logged in — sync this tab's state
        const userId     = localStorage.getItem('userId');
        const userGender = localStorage.getItem('userGender');
        setLoginuser(userId);
        setIsLoggedIn(true);
      } else {
        // Another tab logged out — sync this tab's state
        setLoginuser(null);
        setIsLoggedIn(false);
      }
    }
  };

  // Listen for localStorage changes from other tabs
  window.addEventListener('storage', handleStorageChange);

  // Cleanup on unmount
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
  // ── Verify session on every page load/refresh ─────────────────────────────
  // Problem this solves: localStorage says isLoggedIn=true but cookies expired
  // Solution: make a real protected API call on mount
  //   - If accessToken cookie valid → stays logged in
  //   - If accessToken expired but refreshToken valid → api.js auto-refreshes silently
  //   - If both expired → api.js redirects to /login, we clear state here too
  useEffect(() => {
    const verifySession = async () => {
      const storedLogin = localStorage.getItem('isLoggedIn') === 'true';
      const userId      = localStorage.getItem('userId');

      if (!storedLogin || !userId) return; // not logged in — nothing to verify

      try {
        // Make a lightweight protected call to verify HttpOnly cookie is valid
        // api.js interceptor auto-refreshes if accessToken cookie expired
        await api.post('/FetchUserDetails', { uid: userId });
        // Reaches here → session valid, keep logged-in state
      } catch (err) {
        // Both cookies expired — api.js already redirects to /login
        // Also clear React state here
        setLoginuser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('userId');
        localStorage.removeItem('userGender');
        localStorage.setItem('isLoggedIn', 'false');
      }
    };

    verifySession();
  }, []); // runs once on app mount

  // ── Login ──────────────────────────────────────────────────────────────────
  // loginUser() calls POST /login
  // Server sets HttpOnly cookies (accessToken + refreshToken)
  // We only get userId + userGender in response body — no tokens
  const login = async (userEmail, userPassword) => {
    try {
      const response = await loginUser(userEmail, userPassword);

      if (response.data.status === 'Success') {
        const { userId, userGender } = response.data.data;
        setLoginuser(userId);
        setIsLoggedIn(true);
        // tokenUtils.setUserInfo() already called inside loginUser()
        // Just update React state here
        localStorage.setItem('userId',     String(userId));
        localStorage.setItem('userGender', userGender || '');
        localStorage.setItem('isLoggedIn', 'true');
        return { success: true };
      } else {
        // Failed login: clear auth state. loginuser MUST be null (not a message
        // string) — the Header shows the logged-in menu whenever loginuser is
        // truthy, so a message string here wrongly rendered the "Me" menu.
        setLoginuser(null);
        setIsLoggedIn(false);
        localStorage.setItem('isLoggedIn', 'false');
        // Surface the backend's message (e.g. "Invalid Credentials.") to the caller.
        return { success: false, message: response.data.result || 'Invalid credentials.' };
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginuser(null);
      setIsLoggedIn(false);
      localStorage.setItem('isLoggedIn', 'false');
      return { success: false, message: 'Invalid credentials.' };
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  // logoutUser() calls POST /logout
  // Server clears HttpOnly cookies → tokens gone
  // We clear localStorage UI state
  const logout = async () => {
    await logoutUser();
    setLoginuser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ login, loginuser, isLoggedIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};