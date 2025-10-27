import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { FaLock, FaCalendarCheck, FaSearchDollar, FaHandshake, FaChartLine, FaMapPin, FaClock, FaStar, FaSearch, FaBriefcase, FaCalendarAlt } from 'react-icons/fa';

// Add responsive styles
const responsiveStyles = `
  /* Feature card hover effects */
  .feature-card {
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .feature-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  }
  
  .feature-card:active {
    transform: translateY(-4px);
  }
  
  .how-it-works-card {
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .how-it-works-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    background-color: #f9f9f9;
  }
  
  .how-it-works-card:active {
    transform: translateY(-4px) scale(1.01);
  }
  
  .flip-card {
    background-color: transparent;
    width: 100%;
    height: 280px;
    perspective: 1000px;
    cursor: pointer;
    transition: all 0.3s ease;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  
  .flip-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.6s;
    transform-style: preserve-3d;
  }
  
  .flip-card:hover .flip-card-inner {
    transform: rotateY(180deg);
  }
  
  .flip-card:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }
  
  .flip-card:active .flip-card-front,
  .flip-card:active .flip-card-back {
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  
  @media (max-width: 768px) {
    .flip-card:active {
      transform: scale(0.97);
    }
  }
  
  .flip-card-front, .flip-card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 32px;
    box-sizing: border-box;
  }
  
  .flip-card-front {
    background-color: #fafafa;
    color: #8B4513;
  }
  
  .flip-card-back {
    background-color: #fafafa;
    color: #8B4513;
    transform: rotateY(180deg);
  }
  
  .flip-card-back h3 {
    color: #8B4513 !important;
    margin-bottom: 16px;
  }
  
  .flip-card-back p {
    color: #8B4513 !important;
  }
  
  @media (max-width: 768px) {
    .how-it-works-grid {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }
    
    .centered-card-container {
      justify-content: stretch !important;
    }
    
    .how-it-works-grid > div,
    .centered-card-container > div {
      max-width: none !important;
      width: 100% !important;
    }
    
    .responsive-section {
      padding: 40px 16px !important;
    }
    
    .responsive-hero {
      padding: 60px 16px !important;
    }
    
    .responsive-hero h1 {
      font-size: 2.5rem !important;
    }
    
    .responsive-hero p {
      font-size: 1rem !important;
    }
    
    .flip-card {
      height: 260px;
    }
  }
  
  @media (max-width: 480px) {
    .how-it-works-grid > div,
    .centered-card-container > div {
      padding: 24px !important;
    }
    
    .responsive-section {
      padding: 32px 12px !important;
    }
    
    .responsive-hero {
      padding: 40px 12px !important;
    }
    
    .responsive-hero h1 {
      font-size: 2rem !important;
    }
    
    .flip-card {
      height: 240px;
    }
    
    .flip-card-front, .flip-card-back {
      padding: 24px;
    }
  }
`;

const EarnAsArtist = () => {
  const navigate = useNavigate();

  const handleJoinAsArtist = () => {
    navigate('/choose-path');
  };

  return (
    <>
      <style>{responsiveStyles}</style>
      <Header />
      <main className="main" style={{ paddingTop: '80px' }}>
        {/* Hero Section */}
        <section className="responsive-hero" style={{
          backgroundColor: '#E4C293',
          padding: '80px 20px',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              color: '#8B4513',
              marginBottom: '24px',
              lineHeight: '1.2'
            }}>
              Earn with Your Art. Be Seen. Be Booked.
            </h1>
            <p style={{
              fontSize: '1.2rem',
              color: '#8B4513',
              marginBottom: '16px',
              lineHeight: '1.6'
            }}>
              Join <strong>Mehndi Me</strong>, the platform built for mehndi artists — where your creativity is celebrated, your time is respected, and your talent turns into steady
bookings.
            </p>
            <button
              onClick={handleJoinAsArtist}
              className="nav__cta-button"
              style={{
                fontSize: '1.1rem',
                padding: '0.75rem 1.5rem',
                borderRadius:'10px'
              }}
            >
              Join as an Artist
            </button>
                <p style={{
                  fontSize: '1rem',
                  color: '#8B4513',
                  marginTop: '20px',
                  lineHeight: '1.6',
                  fontWeight: '500'
                }}>
                  It only takes 2 minutes to get started.
                </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="responsive-section" style={{
          padding: '80px 20px',
          backgroundColor: '#E4C293'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {/* Secure Bookings Card */}
            <div className="feature-card" style={{
              backgroundColor: '#fafafa',
              padding: '32px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px', color: '#ff8c00' }}>
                <FaLock/>
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#8B4513',
                marginBottom: '12px'
              }}>
                Secure Bookings
              </h3>
              <p style={{
                color: '#8B4513',
                lineHeight: '1.6'
              }}>
                All chats and payments happen safely through our platform — no more chasing payments or DMs.
              </p>
            </div>

            {/* We Handle the Admin Card */}
            <div className="feature-card" style={{
              backgroundColor: '#fafafa',
              padding: '32px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px' }}>
                <FaCalendarAlt/>
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#8B4513',
                marginBottom: '12px'
              }}>
                We Handle the Admin
              </h3>
              <p style={{
                color: '#8B4513',
                lineHeight: '1.6'
              }}>
                From bookings to reminders, we keep your calendar organized so you can focus on your designs.
              </p>
            </div>
          </div>
        </section>

          {/* How It Works Section */}

        <section className="responsive-section" style={{
          padding: '0px 20px',
          backgroundColor: '#E4C293'
        }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* First Row - Two Cards */}
            <div 
              className="how-it-works-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                marginBottom: '24px'
              }}
            >
              {/* Apply to Client Requests */}
              <div className="how-it-works-card" style={{
                backgroundColor: '#ffffff',
                padding: '32px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '16px', color: '#ff69b4' }}>
                  <FaMapPin />
                </div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  color: '#8B4513',
                  marginBottom: '12px'
                }}>
                  Apply to Client Requests
                </h3>
                <p style={{
                  color: '#8B4513',
                  lineHeight: '1.6'
                }}>
                  Browse client requests and apply to the ones that fit your style.
                </p>
              </div>

              {/* Flexible Work */}
              <div className="how-it-works-card" style={{
                backgroundColor: '#ffffff',
                padding: '32px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '16px', color: '#ff0000' }}>
                  <FaClock />
                </div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  color: '#8B4513',
                  marginBottom: '12px'
                }}>
                  Flexible Work
                </h3>
                <p style={{
                  color: '#8B4513',
                  lineHeight: '1.6'
                }}>
                  Apply only to jobs that match your availability and preferred style.
                </p>
              </div>
            </div>

            {/* Second Row - Centered Card */}
            <div 
              className="centered-card-container"
              style={{
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              {/* Grow Your Brand */}
              <div className="how-it-works-card" style={{
                backgroundColor: '#ffffff',
                padding: '32px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'left',
                maxWidth: '400px',
                width: '100%'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '16px', color: '#ffd700' }}>
                  <FaStar />
                </div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  color: '#8B4513',
                  marginBottom: '12px'
                }}>
                  Grow Your Brand
                </h3>
                <p style={{
                  color: '#8B4513',
                  lineHeight: '1.6'
                }}>
                  Earn reviews, build your reputation, and showcase your mehndi style.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Fair Transparent Pricing Section */}
        <section className="responsive-section" style={{
          padding: '80px 20px',
          backgroundColor: '#E4C293'
        }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              color: '#8B4513',
              marginBottom: '24px'
            }}>
              Fair, Transparent Pricing
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: '#8B4513',
              marginBottom: '48px',
              maxWidth: '600px',
              margin: '0 auto 48px auto'
            }}>
              We charge a small service fee to support you and the platform. Tap a card below to see how our values shape our pricing.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginTop: '48px'
            }}>
              {/* Transparency Card */}
              <div className="flip-card">
                <div className="flip-card-inner">
                  <div className="flip-card-front">
                    <div style={{ fontSize: '2rem', marginBottom: '16px' }}>
                      <FaSearch />
                    </div>
                    <h3 style={{
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      color: '#8B4513',
                      marginBottom: '12px'
                    }}>
                      Transparency
                    </h3>
                    <p style={{
                      color: '#8B4513',
                      lineHeight: '1.6'
                    }}>
                      We're upfront about our pricing.
                    </p>
                  </div>
                  <div className="flip-card-back">
                    <p style={{
                      lineHeight: '1.6',
                      fontSize: '1rem',
                      textAlign: 'left'
                    }}>
                      That's why we tell you from day one that after your first 3 months, we charge a 15% commission — no surprises, no hidden fees.
                    </p>
                  </div>
                </div>
              </div>

              {/* Honesty Card */}
              <div className="flip-card">
                <div className="flip-card-inner">
                  <div className="flip-card-front">
                    <div style={{ fontSize: '2rem', marginBottom: '16px' }}>
                      <FaHandshake />
                    </div>
                    <h3 style={{
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      color: '#8B4513',
                      marginBottom: '12px'
                    }}>
                      Honesty
                    </h3>
                    <p style={{
                      color: '#8B4513',
                      lineHeight: '1.6'
                    }}>
                      We believe in fair value.
                    </p>
                  </div>
                  <div className="flip-card-back">
                    <p style={{
                      lineHeight: '1.6',
                      fontSize: '1rem',
                      textAlign: 'left'
                    }}>
                      Our service fee supports platform growth, artist promotion, marketing, tech, and client support — all for you.
                    </p>
                  </div>
                </div>
              </div>

              {/* Integrity Card */}
              <div className="flip-card">
                <div className="flip-card-inner">
                  <div className="flip-card-front">
                    <div style={{ fontSize: '2rem', marginBottom: '16px' }}>
                      <FaBriefcase />
                    </div>
                    <h3 style={{
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      color: '#8B4513',
                      marginBottom: '12px'
                    }}>
                      Integrity
                    </h3>
                    <p style={{
                      color: '#8B4513',
                      lineHeight: '1.6'
                    }}>
                      Your success is our success.
                    </p>
                  </div>
                  <div className="flip-card-back">
                    <p style={{
                      lineHeight: '1.6',
                      fontSize: '1rem',
                      textAlign: 'left'
                    }}>
                      We're more than a platform — we're a community where artists feel seen, valued, and supported like family.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

       

        {/* CTA Section */}
        <section className="responsive-section" style={{
          padding: '80px 20px',
          backgroundColor: '#E4C293',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              color: '#8B4513',
              marginBottom: '24px'
            }}>
              Ready to Start Earning?
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: '#8B4513',
              marginBottom: '32px',
              lineHeight: '1.6'
            }}>
              Join our community of talented mehndi artists and start building your business today.
            </p>
            <button
              onClick={handleJoinAsArtist}
              className="nav__cta-button"
              style={{
                fontSize: '1.1rem',
                padding: '0.75rem 1.5rem',
                borderRadius:'10px'
              }}
            >
              Join as an Artist
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default EarnAsArtist;
