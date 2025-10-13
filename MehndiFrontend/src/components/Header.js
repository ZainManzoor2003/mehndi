import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 30;
      setIsScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    console.log('Hamburger clicked! Current state:', isMenuOpen, 'New state:', !isMenuOpen);
    
    if (!isMenuOpen) {
      // First show the henna pattern animation
      setIsMenuOpen(true); // This triggers the henna pattern
      
      // Then open the overlay menu after the henna animation completes (1.2 seconds)
      setTimeout(() => {
        const overlay = document.querySelector('.nav__overlay');
        if (overlay) {
          overlay.classList.add('nav__overlay--active');
        }
        document.body.style.overflow = 'hidden';
      }, 1200);
    } else {
      // Close the menu smoothly
      const overlay = document.querySelector('.nav__overlay');
      if (overlay) {
        overlay.classList.remove('nav__overlay--active');
      }
      
      // Wait for overlay to close, then reset henna pattern
      setTimeout(() => {
        setIsMenuOpen(false);
        document.body.style.overflow = 'auto';
      }, 600); // Wait for overlay transition to complete
    }
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    document.body.classList.toggle('dark-theme');
  };

  const closeMenu = () => {
    console.log('Closing menu...');
    // Close the overlay first
    const overlay = document.querySelector('.nav__overlay');
    if (overlay) {
      overlay.classList.remove('nav__overlay--active');
    }
    
    // Wait for overlay to close, then reset henna pattern
    setTimeout(() => {
      setIsMenuOpen(false);
      document.body.style.overflow = 'auto';
    }, 600);
  };

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    // Always close the menu first (with its built-in animation timing)
    closeMenu();

    const headerHeight = 80; // Account for fixed header

    const tryScroll = (retries = 20) => {
      const target = document.querySelector(targetId);
      if (target) {
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        return;
      }
      if (retries > 0) setTimeout(() => tryScroll(retries - 1), 75);
    };

    const proceed = () => {
      // Small delay to allow layout to settle after route/menu animation
      setTimeout(() => tryScroll(), 350);
    };

    if (location.pathname !== '/') {
      // Navigate to home first, then scroll to the section
      navigate('/');
      proceed();
    } else {
      proceed();
    }
  };

  return (
    <>
      <header className={`header ${isScrolled ? 'scroll-header' : ''}`} id="header">
        <nav className="nav container">
          {/* Left: Hamburger Menu */}
          <div className="nav__toggle" id="nav-toggle" onClick={toggleMenu}>
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" width="60" height="60" className={`burger-svg ${isMenuOpen ? 'active' : ''}`}> 
              <style> 
                {`
                  .burger line { 
                    stroke: #EA7C25; 
                    stroke-width: 3.2; 
                    stroke-linecap: round; 
                    opacity: 1;
                    transition: opacity .6s ease-in; 
                  } 
                  .flower path, .flower circle { 
                    stroke: #EA7C25; 
                    fill: none; 
                    stroke-width: 1.8; 
                    opacity: 0; 
                    stroke-linecap: round; 
                    stroke-linejoin: round; 
                    transition: opacity .4s ease-out;
                  } 
                  @keyframes draw { to { stroke-dashoffset: 0; opacity: 1; } }
                  @keyframes fadeOut { to { opacity: 0; } }
                  
                  .burger-svg.active .burger line {
                    opacity: 0;
                    transition: opacity .3s ease-out;
                  }
                  .burger-svg.active .flower path,
                  .burger-svg.active .flower circle {
                    animation: draw .5s ease-out forwards;
                  }
                  .burger-svg.active .flower circle {
                    animation-delay: 0s;
                  }
                  .burger-svg.active .flower path:nth-child(2) {
                    animation-delay: 0.1s;
                  }
                  .burger-svg.active .flower path:nth-child(3) {
                    animation-delay: 0.2s;
                  }
                  .burger-svg.active .flower path:nth-child(4) {
                    animation-delay: 0.3s;
                  }
                  .burger-svg.active .flower path:nth-child(5) {
                    animation-delay: 0.4s;
                  }
                `}
              </style> 
              
              <g className="burger"> 
                <line x1="7" y1="10" x2="25" y2="10"/> 
                <line x1="7" y1="16" x2="25" y2="16"/> 
                <line x1="7" y1="22" x2="25" y2="22"/> 
              </g> 
              <g className="flower"> 
                <circle cx="16" cy="16" r="3"/> 
                <path d="M16 6 Q18 10 16 12 Q14 10 16 6"/> 
                <path d="M16 26 Q18 22 16 20 Q14 22 16 26"/> 
                <path d="M6 16 Q10 18 12 16 Q10 14 6 16"/> 
                <path d="M26 16 Q22 18 20 16 Q22 14 26 16"/> 
              </g> 
            </svg>
          </div>

          {/* Center: Logo */}
          <a href="#home" className="nav__logo" onClick={(e) => handleNavClick(e, '#home')}>
            <img src="/assets/logo icon.png" alt="Mehndi Me" style={{ height: 96, margin: "10px 0", display: 'block' }} />
          </a>

          {/* Right: Dashboard Button or Get Started */}
          {isAuthenticated && user ? (
            <Link 
              to={user.userType === 'artist' ? '/artist-dashboard' : user.userType === 'admin' ? '/admin-dashboard/users' : '/dashboard'} 
              className="nav__cta-button"
            >
              Go To Dashboard
            </Link>
          ) : (
            <Link to="/choose-path" className="nav__cta-button">Get Started</Link>
          )}
        </nav>
      </header>

      {/* Full Screen Overlay Menu */}
      <div className="nav__overlay">
        <div className="nav__overlay-content">
          <div className="nav__overlay-header">
            <div className="nav__overlay-logo">
              <img src="/assets/logo text.png" alt="Mehndi Me" style={{ height: 28, display: 'block' }} />
            </div>
            <div className="nav__overlay-close" onClick={closeMenu}>
              <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" width="40" height="40" className={`close-svg ${isMenuOpen ? 'active' : ''}`}> 
                <style> 
                  {`
                    .close-x line { 
                      stroke: #EA7C25; 
                      stroke-width: 3.2; 
                      stroke-linecap: round; 
                      transition: opacity .3s ease; 
                    } 
                    .close-flower path, .close-flower circle { 
                      stroke: #EA7C25; 
                      fill: none; 
                      stroke-width: 1.8; 
                      opacity: 0; 
                      stroke-linecap: round; 
                      stroke-linejoin: round; 
                    } 
                    @keyframes drawClose { to { stroke-dashoffset: 0; opacity: 1; } }
                    .close-svg.active .close-x line {
                      opacity: 0;
                    }
                    .close-svg.active .close-flower path,
                    .close-svg.active .close-flower circle {
                      animation: drawClose .5s ease-out forwards;
                    }
                    .close-svg.active .close-flower circle {
                      animation-delay: 0s;
                    }
                    .close-svg.active .close-flower path:nth-child(2) {
                      animation-delay: 0.1s;
                    }
                    .close-svg.active .close-flower path:nth-child(3) {
                      animation-delay: 0.2s;
                    }
                    .close-svg.active .close-flower path:nth-child(4) {
                      animation-delay: 0.3s;
                    }
                    .close-svg.active .close-flower path:nth-child(5) {
                      animation-delay: 0.4s;
                    }
                  `}
                </style> 
                
                <g className="close-x"> 
                  <line x1="8" y1="8" x2="24" y2="24"/> 
                  <line x1="24" y1="8" x2="8" y2="24"/> 
                </g> 
                <g className="close-flower"> 
                  <circle cx="16" cy="16" r="3"/> 
                  <path d="M16 6 Q18 10 16 12 Q14 10 16 6"/> 
                  <path d="M16 26 Q18 22 16 20 Q14 22 16 26"/> 
                  <path d="M6 16 Q10 18 12 16 Q10 14 6 16"/> 
                  <path d="M26 16 Q22 18 20 16 Q22 14 26 16"/> 
                </g> 
              </svg>
            </div>
          </div>
          
          <nav className="nav__overlay-menu" style={{ textAlign: 'left' }}>
            <ul
              className="nav__overlay-list"
              style={{
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                width: 'auto',
                // maxWidth: 420,
                marginLeft: 0,
                textAlign: 'left'
              }}
            >
              {/* Section heading: Clients */}
              <li className="nav__overlay-item" style={{opacity: 1, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 800, color: '#2b2118', width: '100%'}}>
                <span className="nav__overlay-number"><strong>Clients</strong></span>
              </li>
              {/* Home - real link */}
              <li className="nav__overlay-item">
                <a href="#home" className="nav__overlay-link" onClick={(e) => handleNavClick(e, '#home')}>
                  <span className="nav__overlay-number">
                    <img src="/images/1.png" alt="01" width="64" height="64" />
                  </span>
                  <span className="nav__overlay-text">Home</span>
                </a>
              </li>
              {/* Request a Mehndi Artist - temp -> home */}
              <li className="nav__overlay-item">
                <a href="#home" className="nav__overlay-link" onClick={(e) => handleNavClick(e, '#home')}>
                  <span className="nav__overlay-number">
                    <img src="/images/2.png" alt="02" width="64" height="64" />
                  </span>
                  <span className="nav__overlay-text">Request a Mehndi Artist</span>
                </a>
              </li>

              {/* Section heading: Artists */}
              <li className="nav__overlay-item" style={{opacity: 1, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '1.25rem', fontWeight: 800, color: '#2b2118', width: '100%'}}>
                <span className="nav__overlay-number"><strong>Artists</strong></span>
              </li>
              {/* Browse Requests - temp -> home */}
              <li className="nav__overlay-item">
                <a href="#home" className="nav__overlay-link" onClick={(e) => handleNavClick(e, '#home')}>
                  <span className="nav__overlay-number">
                    <img src="/images/3.png" alt="03" width="64" height="64" />
                  </span>
                  <span className="nav__overlay-text">Browse Requests</span>
                </a>
              </li>
              {/* Earn as an Artist - temp -> home */}
              <li className="nav__overlay-item">
                <a href="#home" className="nav__overlay-link" onClick={(e) => handleNavClick(e, '#home')}>
                  <span className="nav__overlay-number">
                    <img src="/images/4.png" alt="04" width="64" height="64" />
                  </span>
                  <span className="nav__overlay-text">Earn as an Artist</span>
                </a>
              </li>

              {/* Section heading: Discover */}
              <li className="nav__overlay-item" style={{opacity: 1, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '1.25rem', fontWeight: 800, color: '#2b2118', width: '100%'}}>
                <span className="nav__overlay-number"><strong>Discover</strong></span>
              </li>
              {/* Blog - real link */}
              <li className="nav__overlay-item">
                <Link to="/blogs" className="nav__overlay-link" onClick={closeMenu}>
                  <span className="nav__overlay-number">
                    <img src="/images/5.png" alt="05" width="64" height="64" />
                  </span>
                  <span className="nav__overlay-text">Blog</span>
                </Link>
              </li>
              {/* FAQ - scroll to FAQ section */}
              <li className="nav__overlay-item">
                <a href="#faq" className="nav__overlay-link" onClick={(e) => handleNavClick(e, '#faq')}>
                  <span className="nav__overlay-number">
                    <img src="/images/6.png" alt="06" width="64" height="64" />
                  </span>
                  <span className="nav__overlay-text">FAQ</span>
                </a>
              </li>
              {/* About Us - scroll to section */}
              <li className="nav__overlay-item">
                <a href="#aboutus" className="nav__overlay-link" onClick={(e) => handleNavClick(e, '#aboutus')}>
                  <span className="nav__overlay-number">
                    <img src="/images/7.png" alt="07" width="64" height="64" />
                  </span>
                  <span className="nav__overlay-text">About Us</span>
                </a>
              </li>
            </ul>
          </nav>

          <div className="nav__overlay-footer">            
            <div className="nav__overlay-cta">
              {isAuthenticated && user ? (
                <button 
                  className="nav__overlay-button" 
                  onClick={() => { 
                    closeMenu(); 
                    navigate(user.userType === 'artist' ? '/artist-dashboard' : '/dashboard'); 
                  }}
                >
                  Go To Dashboard
                </button>
              ) : (
                <button 
                  className="nav__overlay-button" 
                  onClick={() => { closeMenu(); navigate('/choose-path'); }}
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header; 