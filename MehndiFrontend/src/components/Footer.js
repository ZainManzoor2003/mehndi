import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Top row: brand left, contact + social right */}
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

        {/* Middle row: 3 link sections centered in one row */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '3rem', flexWrap: 'wrap', padding: '2rem 0', borderTop: '1px solid rgba(255, 255, 255, 0.1)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="footer__content" style={{ textAlign: 'center', minWidth: '220px' }}>
            <h3 className="footer__title">For Mehndi Artists</h3>
            <ul className="footer__list">
              <li><a href="#" className="footer__link">Earn as a Mehndi Artist</a></li>
              <li><a href="#" className="footer__link">Browse Bookings</a></li>
              <li><a href="#" className="footer__link">Artist Dashboard</a></li>
              <li><a href="#" className="footer__link">FAQs for Artists</a></li>
            </ul>
          </div>

          <div className="footer__content" style={{ textAlign: 'center', minWidth: '220px' }}>
            <h3 className="footer__title">For Clients</h3>
            <ul className="footer__list">
              <li><a href="#" className="footer__link">Request an Artist</a></li>
              <li><a href="#" className="footer__link">Log In / Sign Up</a></li>
              <li><a href="#" className="footer__link">FAQs for Clients</a></li>
              <li><a href="#" className="footer__link">Blog</a></li>
            </ul>
          </div>

          <div className="footer__content" style={{ textAlign: 'center', minWidth: '220px' }}>
            <h3 className="footer__title">Trust & Transparency</h3>
            <ul className="footer__list">
              <li><a href="#" className="footer__link">Privacy Policy</a></li>
              <li><a href="#" className="footer__link">Terms & Conditions</a></li>
              <li><a href="#" className="footer__link">Code of Conduct</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* <div className="footer__info container">
        <div className="footer__card">
          <div className="footer__card-box">
            <i className="ri-customer-service-2-line"></i>
            <div>
              <h3 className="footer__card-title">24/7 Support</h3>
              <p className="footer__card-description">Always here to help</p>
            </div>
          </div>
        </div>

        <div className="footer__card">
          <div className="footer__card-box">
            <i className="ri-shield-check-line"></i>
            <div>
              <h3 className="footer__card-title">Verified Artists</h3>
              <p className="footer__card-description">Trusted professionals</p>
            </div>
          </div>
        </div>

        <div className="footer__card">
          <div className="footer__card-box">
            <i className="ri-secure-payment-line"></i>
            <div>
              <h3 className="footer__card-title">Secure Payment</h3>
              <p className="footer__card-description">Safe transactions</p>
            </div>
          </div>
        </div>

        <div className="footer__card">
          <div className="footer__card-box">
            <i className="ri-medal-line"></i>
            <div>
              <h3 className="footer__card-title">Quality Guarantee</h3>
              <p className="footer__card-description">100% satisfaction</p>
            </div>
          </div>
        </div>
      </div> */}
        
      <div className="footer__bottom container" style={{ textAlign: 'center', paddingTop: '2rem' }}>
          <div className="footer__copy">
            <p>&copy; 2024 Mehndi Me. All rights reserved</p>
          </div>
        </div>
    </footer>
  );
};

export default Footer; 