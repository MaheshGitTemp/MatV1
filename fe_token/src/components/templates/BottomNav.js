// src/components/templates/BottomNav.js
// ─────────────────────────────────────────────────────────────────────────────
// MOBILE-ONLY fixed bottom navigation bar (PhonePe-style).
// 5 items: Home, Matches, Search (advanced search), Chat, Dashboard.
// - Renders only on mobile widths (< 768px).
// - Hidden on the admin area (/adminhub/*), which has its own shell.
// - Highlights the active route in the brand color.
// Mounted once in App.js inside <Router> so it appears on every page.
// Styling lives in src/assets/css/theme.css (.bnav*).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/',              label: 'Home',      icon: 'fas fa-home' },
  { to: '/profiles',      label: 'Matches',   icon: 'fas fa-heart' },
  { to: '/advancesearch', label: 'Search',    icon: 'fas fa-search' },
  { to: '/messages',      label: 'Chat',      icon: 'far fa-comment-dots' },
  { to: '/dashboard',     label: 'Dashboard', icon: 'fas fa-th-large' },
];

const BottomNav = () => {
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Desktop: no bottom nav. Admin area: no bottom nav (own layout).
  if (!isMobile) return null;
  if (location.pathname.startsWith('/adminhub')) return null;
  if (location.pathname === '/impersonate') return null;

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <>
      {/* Spacer so page content/footer isn't hidden behind the fixed bar */}
      <div className="bnav-spacer" aria-hidden="true" />

      <nav className="bnav">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={active ? 'bnav__item is-active' : 'bnav__item'}
              onClick={() => {
                // Always scroll to the top so the user lands on the start of the
                // page — works whether navigating to a new route or re-tapping
                // the current one (where the route doesn't change). A short
                // timeout lets the destination render before scrolling.
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
              }}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default BottomNav;
