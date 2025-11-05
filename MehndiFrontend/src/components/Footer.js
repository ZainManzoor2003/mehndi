import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Make sure your CSS file is imported
// import './App.css'; 

const Footer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLinkClick = (path, requiresAuth = false) => {
    if (requiresAuth && !user) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  return (
    <footer className="footer" style={{backgroundColor: 'var(--first-color)'}}>
      <div className="footer__container container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* === Top Row === */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
          <div className="footer__content footer__brand" style={{ flex: '1 1 320px', minWidth: '280px' }}>
            <a href="/" className="footer__logo">
              Mehndi Me
            </a>
            <p className="footer__description">
              Connect with talented mehndi artists and discover beautiful designs. Your trusted platform for authentic mehndi experiences.
            </p>
          </div>

          <div className="footer__content" style={{ flex: '0 1 320px', minWidth: '260px', textAlign: 'center' }}>
            <div className="footer__contact" style={{ marginBottom: '0.75rem' }}>
              <p className="footer__email" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ri-mail-line"></i>
                <a href="mailto:team.mehndime@gmail.com" className="footer__email-link">team.mehndime@gmail.com</a>
              </p>
            </div>
            <div className="footer__social" style={{ display: 'flex', gap: '10px' }}>
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="footer__social-link">
                <i className="ri-instagram-fill"></i>
              </a>
              <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" className="footer__social-link">
                <i className="ri-facebook-fill"></i>
              </a>
              <a href="https://www.pinterest.com/" target="_blank" rel="noreferrer" className="footer__social-link">
                <i className="ri-pinterest-fill"></i>
              </a>
              <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="footer__social-link">
                <i className="ri-youtube-fill"></i>
              </a>
            </div>
          </div>
        </div>

        {/* === Middle Row (Now Fully Responsive) === */}
        <div className="footer-middle-row" style={{justifyContent:'space-around'}}>
          <div className="footer__content" style={{ textAlign: 'center', minWidth: '220px' }}>
            <h3 className="footer__title">For Mehndi Artists</h3>
            <ul className="footer__list">
              <li><a href="#" className="footer__link" onClick={(e) => { e.preventDefault(); navigate('/earn-as-artist'); }}>Earn as a Mehndi Artist</a></li>
              <li><a href="#" className="footer__link" onClick={(e) => { e.preventDefault(); handleLinkClick('/artist-dashboard', true); }}>Browse Bookings</a></li>
              <li><a href="#" className="footer__link" onClick={(e) => { e.preventDefault(); handleLinkClick('/artist-dashboard', true); }}>Artist Dashboard</a></li>
              <li><a href="#" className="footer__link" onClick={(e) => { e.preventDefault(); handleLinkClick('/faq'); }}>FAQs for Artists</a></li>
            </ul>
          </div>

          <div className="footer__content" style={{ textAlign: 'center', minWidth: '220px' }}>
            <h3 className="footer__title">For Clients</h3>
            <ul className="footer__list">
              <li><a href="#" className="footer__link" onClick={(e) => { e.preventDefault(); handleLinkClick('/booking', true); }}>Request an Artist</a></li>
              <li><a href="#" className="footer__link" onClick={(e) => { e.preventDefault(); navigate('/choose-path'); }}>Log In / Sign Up</a></li>
              <li><a href="#" className="footer__link" onClick={(e) => { e.preventDefault(); handleLinkClick('/faq');}}>FAQs for Clients</a></li>
              <li><a href="#" className="footer__link" onClick={(e) => { e.preventDefault(); navigate('/blogs'); }}>Blog</a></li>
            </ul>
          </div>

          <div className="footer__content" style={{ textAlign: 'center', minWidth: '220px' }}>
            <h3 className="footer__title">Trust & Transparency</h3>
            <ul className="footer__list">
              <li><a href="#" className="footer__link" onClick={(e) => { e.preventDefault(); navigate('/privacy-policy'); }}>Privacy Policy</a></li>
              <li><a href="#" className="footer__link" onClick={(e) => { e.preventDefault(); navigate('/terms-conditions'); }}>Terms & Conditions</a></li>
              {/* <li><a href="#" className="footer__link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Code of Conduct</a></li> */}
            </ul>
          </div>
        </div>
      </div>
      
      {/* === Bottom Row === */}
      <div className="footer__bottom container" style={{ textAlign: 'center', paddingTop: '2rem' }}>
          <div className="footer__copy">
            <p>&copy; 2024 Mehndi Me. All rights reserved</p>
          </div>
        </div>
    </footer>
  );
};

export default Footer;