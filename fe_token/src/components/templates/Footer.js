import React from 'react'

import { imageUrl } from '../../utils/imageUrl';
import  logos from "../../components/templates/ImagesLoader"

const Footer = () => {
  return (
    <>
    {/*  <!--Footer Start--> */}
    <div className="footer-wrap">
      <div className="container">
        <div className="row">
          <div className="col-lg-3 col-md-6">
            <div className="ftabout"> 
              {/* <img src={logos.logo} alt=""/> */}
             <img src={imageUrl("/uploads/gallery/telugu_sambandham_navbar_v14.png")} alt="Logo" />
              <p>Exclusive Launch Offer — Register free and be among the first to find your perfect Telugu match. A safe, secure matrimony platform built with love for Telugu families.</p>
              {/* <ul className="socialLinks">
                <li><a href="#" onClick={(e) => e.preventDefault()} title="Facebook"><i className="fab fa-facebook-f"></i></a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} title="Twitter"><i className="fab fa-twitter"></i></a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} title="Google+"><i className="fab fa-instagram"></i></a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} title="Whatsapp"><i className="fab fa-google-plus-g"></i></a></li>
              </ul> */}
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <h3>Site Links</h3>
            <ul className="footernav">
              <li><a href="#" onClick={(e) => e.preventDefault()}>Home</a></li>
              {/* <li><a href="#" onClick={(e) => e.preventDefault()}>About Us</a></li> */}
              <li><a href="#" onClick={(e) => e.preventDefault()}>Contact Us</a></li>
              {/* <li><a href="#" onClick={(e) => e.preventDefault()}>FAQs</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Terms of Use</a></li> */}
            </ul>
          </div>
          {/* <div className="col-lg-3 col-md-6">
            <h3>Wedding Services</h3>
            <ul className="footernav">
              <li><a href="#" onClick={(e) => e.preventDefault()}>Search Bride</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Search Groom</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Profile Tips</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Security Tips</a></li>
            </ul>
          </div> */}
          <div className="col-lg-3 col-md-6">
            <h3>Contact Us</h3>
            <ul className="footer-adress">
              <li className="footer_email"><i className="fas fa-map-marker-alt"></i><span><a href="#" onClick={(e) => e.preventDefault()}> Kukatpally & Alwal, Hyderabad, Telangana, India
                </a></span></li>
              <li className="footer_email"><i className="far fa-envelope"></i><span><a href="mailto:"> support@telugusambandham.com</a></span></li>
              {/* <li className="footer-phone"><i className="fas fa-phone-alt"></i><span><a href="tel:">(91) 9666633948</a></span></li> */}
            </ul>
          </div>
        </div>
      </div>
    </div>
    {/* <!--Footer End-->  */}
    
    {/* <!--Copyright Start--> */}
    <div className="copyright-wrap">
      <div className="container">
        <div className="row">
          <div className="col-lg-6 col-md-6">
            <div className="copyight">Copyright © 2026 Telugu Sambandham. All rights reserved.</div>
          </div>
          <div className="col-lg-6 col-md-6">
            {/* <div className="policy">Design and Developed by: <a href="#" onClick={(e) => e.preventDefault()}>Mahesh</a></div> */}
          </div>
        </div>
      </div>
    </div>
    {/* <!--Copyright End-->  */}
    </>
  )
}

export default Footer