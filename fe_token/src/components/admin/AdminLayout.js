// src/components/admin/AdminLayout.js
//
// Minimal admin chrome: a left sidebar with navigation links and a Logout
// button, plus a content area rendered via <Outlet/>. It deliberately does NOT
// import the public Header/Footer — the admin panel is a separate shell.

import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import adminApi from './adminApi';
import '../../assets/css/pages/admin.css';

const navLinkClass = ({ isActive }) => `adm-nav__link${isActive ? ' is-active' : ''}`;

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await adminApi.post('/adminhub/logout');
    } catch (err) {
      // Logout is best-effort; clear the session client-side regardless.
      console.error('Admin logout error:', err);
    }
    navigate('/adminhub/matrimony/login', { replace: true });
  };

  return (
    <div className="adm-shell">
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <span className="adm-brand__icon">
            <i className="fa-solid fa-user-shield" aria-hidden="true" />
          </span>
          <h2 className="adm-brand__title">Admin Panel</h2>
        </div>
        <nav className="adm-nav">
          <NavLink to="/adminhub/matrimony/dashboard" className={navLinkClass}>
            <i className="fa-solid fa-gauge-high" aria-hidden="true" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/adminhub/matrimony/users" className={navLinkClass}>
            <i className="fa-solid fa-users" aria-hidden="true" />
            <span>Users</span>
          </NavLink>
          <NavLink to="/adminhub/matrimony/photos" className={navLinkClass}>
            <i className="fa-solid fa-images" aria-hidden="true" />
            <span>Photos</span>
          </NavLink>
          <NavLink to="/adminhub/matrimony/messageslist" className={navLinkClass}>
            <i className="fa-solid fa-envelope" aria-hidden="true" />
            <span>Messages List</span>
          </NavLink>
          <NavLink to="/adminhub/matrimony/contact-limit" className={navLinkClass}>
            <i className="fa-solid fa-sliders" aria-hidden="true" />
            <span>Contact Limit</span>
          </NavLink>
        </nav>
      </aside>

      <div className="adm-main">
        <header className="adm-topbar">
          <div className="adm-topbar__title">Administration</div>
          <div className="adm-topbar__end">
            <span className="adm-ident">
              <span className="adm-ident__avatar">
                <i className="fa-solid fa-user-shield" aria-hidden="true" />
              </span>
              Administrator
            </span>
            <button type="button" className="adm-btn adm-btn--danger" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
              Logout
            </button>
          </div>
        </header>
        <main className="adm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
