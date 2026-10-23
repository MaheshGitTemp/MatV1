 

import api from '../utils/api';
import { tokenUtils } from '../utils/tokenUtils';

 

export const loginUser = async (email, password) => {
  const response = await api.post('/login', {
    uemail:    email?.trim(),
    upassword: password
  });

  if (response.data.status === 'Success') {
    // Save only non-sensitive UI state to localStorage
    // Tokens are in HttpOnly cookies — browser manages them automatically
    tokenUtils.setUserInfo(
      response.data.data.userId,
      response.data.data.userGender
    );
  }

  return response;
};

// ─── Register ─────────────────────────────────────────────────────────────────
// POST /api/register  (public route — no token needed)
export const registerUser = async (userData) => {
  return await api.post('/register', {
    ...userData,
    uemail:    userData.uemail?.trim(),
    upassword: userData.upassword
  });
};

// ─── Logout ───────────────────────────────────────────────────────────────────
// POST /api/logout — server clears HttpOnly cookies (accessToken + refreshToken)
// We clear localStorage UI state on our side
export const logoutUser = async () => {
  try {
    await api.post('/logout'); // server clears HttpOnly cookies
  } catch (e) {
    console.warn('Logout API error:', e?.message);
  } finally {
    tokenUtils.clearUserInfo(); // clear UI state from localStorage
  }
};

// ─── Send OTP to email ────────────────────────────────────────────────────────
export const sendOtp = async (email) => {
  return await api.post('/sendOtp', { email: email?.trim() });
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export const verifyOtp = async (email, otp) => {
  return await api.post('/verifyOtp', { email: email?.trim(), otp });
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (email, newPassword) => {
  return await api.post('/resetPassword', {
    email:       email?.trim(),
    newPassword
  });
};