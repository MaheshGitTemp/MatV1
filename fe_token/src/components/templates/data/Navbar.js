import React, { useState } from "react";
import "./navbar.css";

const Navbar = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  return (
    <ul className="usernav">
      <li className="dropdown notification">
        <a href="#" className="nav-link dropdown-toggle" id="language" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i className="far fa-bell"></i>
        </a>
        <ul className="dropdown-menu dropdown-menu-right animate slideIn" aria-labelledby="language">
          <li className="nav-item">
            <p><a href="#">Jhon</a> Has Send You Proposal</p>
            <div className="date"><i className="far fa-clock"></i> 1 Aug, 2020 - 01:03 PM</div>
            <a href="#" className="btn">Accept</a> <a href="#" className="btn red">Reject</a>
          </li>
          <li className="nav-item">
            <p><a href="#">Jhon</a> Has Send You Proposal</p>
            <div className="date"><i className="far fa-clock"></i> 1 Aug, 2020 - 01:03 PM</div>
            <a href="#" className="btn">Accept</a> <a href="#" className="btn red">Reject</a>
          </li>
          <li className="nav-item">
            <p><a href="#">Jhon</a> Has Send You Proposal</p>
            <div className="date"><i className="far fa-clock"></i> 1 Aug, 2020 - 01:03 PM</div>
            <div className="accept"><i className="far fa-check-circle"></i> You have accepted proposal</div>
          </li>
          <li className="nav-item">
            <p><a href="#">Jhon</a> Has Send You Proposal</p>
            <div className="date"><i className="far fa-clock"></i> 1 Aug, 2020 - 01:03 PM</div>
            <div className="reject"><i className="fas fa-times"></i> You have Rejected proposal</div>
          </li>
        </ul>
      </li>
      <li className="dropdown">
        <a href="#" className="nav-link dropdown-toggle" id="userdata" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i className="far fa-user"></i> <span>Aqsa Ejaz</span>
        </a>
        <ul className="dropdown-menu dropdown-menu-right animate slideIn" aria-labelledby="userdata">
          <li className="userdet">
            <img src="./assets/images/author-img.jpg" alt="User" />
            <span>Aqsa Ejaz</span>
            <a href="#"><i className="fas fa-user-edit"></i> Edit Profile</a>
          </li>
          <li className="nav-item"><a href="#" className="nav-link"><i className="fas fa-tachometer-alt"></i> Dashboard</a></li>
          <li className="nav-item"><a href="#" className="nav-link"><i className="fas fa-images"></i> Gallery</a></li>
          <li className="nav-item"><a href="#" className="nav-link"><i className="fas fa-lock"></i> Picture Privacy</a></li>
          <li className="nav-item"><a href="#" className="nav-link"><i className="far fa-laugh-squint"></i> Happy Story</a></li>
          <li className="nav-item"><a href="#" className="nav-link"><i className="fas fa-cube"></i> My Package</a></li>
          <li className="nav-item"><a href="#" className="nav-link"><i className="fas fa-history"></i> Payment History</a></li>
          <li className="nav-item"><a href="#" className="nav-link"><i className="far fa-envelope"></i> My Requests</a></li>
          <li className="nav-item"><a href="#" className="nav-link"><i className="fas fa-key"></i> Change Password</a></li>
          <li className="nav-item"><a href="#" className="nav-link"><i className="fas fa-times"></i> Close My Account</a></li>
          <li className="nav-item"><a href="#" className="nav-link"><i className="fas fa-sign-out-alt"></i> Logoutxxxxxx</a></li>
        </ul>
      </li>
      <li className="dropdown lang">
        <a href="#" className="nav-link dropdown-toggle" id="langdrop" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i className="fas fa-globe"></i> <span></span>
        </a>
        <ul className="dropdown-menu dropdown-menu-right animate slideIn" aria-labelledby="langdrop">
          <li className="nav-item"><a href="#" className="nav-link">English</a></li>
          <li className="nav-item"><a href="#" className="nav-link">Urdu</a></li>
          <li className="nav-item"><a href="#" className="nav-link">Arabic</a></li>
        </ul>
      </li>
    </ul>
  
  );
};

export default Navbar;
