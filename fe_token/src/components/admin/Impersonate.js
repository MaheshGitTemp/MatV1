// src/components/admin/Impersonate.js
//
// Public /impersonate handler (shadow login). It reads a one-time token from the
// query string and POSTs {token} to /impersonate/exchange with withCredentials
// so the response's Set-Cookie (the impersonated USER's accessToken/refreshToken)
// is stored by the browser. On success it writes EXACTLY the three localStorage
// keys the real login writes — userId (stringified), userGender (or ''), and
// isLoggedIn='true' — and NO other keys, so the resulting session is
// indistinguishable from a normal login. Then it does a FULL-PAGE navigation to
// /profiles (not a client-side navigate) so the user app boots fresh and
// re-reads localStorage/cookies.
//
// The exchange endpoint is public and token-gated; it does NOT require admin
// credentials. adminApi is reused only because it is a credentialed axios
// instance WITHOUT the user-login redirect interceptor — the call path carries
// no /adminhub namespace.
//
// SAME-BROWSER COOKIE CAVEAT: user cookies (accessToken/refreshToken) and admin
// cookies (adminToken) have different names and coexist, so this does NOT clear
// the admin session. But cookies are per-origin (not per-tab): if the admin also
// had a PERSONAL user session in this browser, this exchange OVERWRITES those
// user cookies with the impersonated user's in ALL tabs of this origin. For the
// admin workflow this is expected; there is no per-tab isolation.

import React, { useEffect, useState } from 'react';
import adminApi from './adminApi';
import '../../assets/css/pages/admin.css';

const Impersonate = () => {
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setError('Missing impersonation token.');
        return;
      }

      try {
        const { data } = await adminApi.post(
          '/impersonate/exchange',
          { token },
          { withCredentials: true }
        );

        if (data.status === 'Success') {
          const { userId, userGender } = data.data;
          // EXACTLY the three keys the real login writes — same keys, same
          // casing (userGender, not usergender), userId stringified, no extras.
          localStorage.setItem('userId', String(userId));
          localStorage.setItem('userGender', userGender || '');
          localStorage.setItem('isLoggedIn', 'true');
          // Full-page navigation so the user app re-boots and re-reads state.
          window.location.href = '/profiles';
        } else {
          setError(data.result || 'Invalid or expired token.');
        }
      } catch (err) {
        setError(err.response?.data?.result || 'Invalid or expired token.');
      }
    };

    run();
  }, []);

  return (
    <div className="adm-loader-page">
      <div className="adm-loader-card">
        {error ? (
          <>
            <div className="adm-loader-card__icon">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
            </div>
            <div className="adm-loader-card__text adm-loader-card__text--error">{error}</div>
          </>
        ) : (
          <>
            <div className="adm-spinner" aria-hidden="true" />
            <div className="adm-loader-card__text">Signing you in…</div>
          </>
        )}
      </div>
    </div>
  );
};

export default Impersonate;
