import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { FaLock, FaHandshake, FaMapPin, FaClock, FaStar, FaSearch, 
  FaBriefcase, FaCalendarAlt } from 'react-icons/fa';

// Add responsive styles
const responsiveStyles = `
  /* Feature card hover effects */
  .feature-card {
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .feature-card:hover {
    transform: translateY(-8px);
    background-color:rgb(255, 248, 240) !important;
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
      padding: 20px 16px !important;
    }
    
    .responsive-hero {
      padding: 60px 16px !important;
    }
    
    .responsive-hero h1,h2 {
      font-size: 2.5rem !important;
    }
    
    .responsive-section h2 {
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
      padding: 12px 12px !important;
    }
    
    .responsive-hero {
      padding: 40px 12px !important;
    }
    
    .responsive-hero h1 {
      font-size: 2rem !important;
    }
    
    .responsive-section h2 {
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
  // Scroll to top on mount
 useEffect(() => {
  try {
    window.scrollTo({ top: 0, behavior: 'instant' });
  } catch {
    window.scrollTo(0, 0);
  }
}, []);

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
            <Link
              to="/signup"
              className="home__cta-button"
            >
              Join as an Artist
            </Link>
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
          padding: '0 20px',
          backgroundColor: '#E4C293'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            maxWidth: '1000px',
            margin: '0 auto',
            marginBottom: '36px'
          }}>
            {/* Secure Bookings Card */}
            <div className="feature-card" style={{
              backgroundColor: '#fff',
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
              backgroundColor: '#fff',
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
                marginBottom: '36px'
              }}
            >
              {/* Apply to Client Requests */}
              <div className="feature-card" style={{
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
              <div className="feature-card" style={{
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
              <div className="feature-card" style={{
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
                    <h3 style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: '#8B4513',
                      marginBottom: '12px',
                      textAlign: 'left'
                    }}>
                      Join as a Founding Artist
                    </h3>
                    <p style={{
                      lineHeight: '1.6',
                      fontSize: '1rem',
                      textAlign: 'left'
                    }}>
                      Get 0% commission for your first month and keep 100% of your earnings. After that, our 10% commission applies — simple, transparent, no hidden fees.
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

       {/* Testimonials Section */}
       <section className="responsive-section" style={{
          padding: '80px 20px',
          // backgroundColor: '#FDF7F0',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              color: '#8B4513',
              marginBottom: '24px',
              lineHeight: '1.2'
            }}>
              Trusted by Mehndi Artists Across the UK
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#A0522D',
              marginBottom: '40px',
              lineHeight: '1.6',
              maxWidth: '700px',
              margin: '0 auto 40px auto'
            }}>
              Artists across the UK are growing their mehndi businesses with Mehndi Me — getting more bookings, saving hours of admin time, and earning more with ease.
            </p>
            
            {/* Separator */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              // marginBottom: '40px'
            }}> <span style={{fontSize: '4.5rem', color: 'var(--accent-orange)'}}>''</span>
              {/* <div style={{
                width: '20px',
                height: '4px',
                backgroundColor: '#CD853F',
                borderRadius: '2px',
                rotate: '90deg'
              }}></div>
              <div style={{
                width: '20px',
                height: '4px',
                backgroundColor: '#CD853F',
                borderRadius: '2px',
                rotate: '90deg'
              }}></div> */}
            </div>

            {/* Testimonial */}
            <blockquote style={{
              fontSize: '1.5rem',
              // fontWeight: 'bold',
              fontStyle: 'italic',
              color: '#8B4513',
              marginBottom: '24px',
              lineHeight: '1.3',
              maxWidth: '800px',
              margin: '0 auto 24px auto'
            }}>
              "Mehndi Me has completely changed how I work. I no longer waste time managing messages or chasing payments — now I can just focus on my art."
            </blockquote>
            
            <p style={{
              fontSize: '1.2rem',
              color: '#8B4513',
              marginBottom: '24px',
              fontWeight: '500'
            }}>
              — Aisha, London
            </p>

            {/* Rating */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '1.5rem', color: '#FFD700' }}>★</span>
              <span style={{
                fontSize: '1rem',
                color: '#8B4513',
                fontWeight: '500'
              }}>
                Rated 4.9/5 by artists across the UK
              </span>
            </div>
          </div>
        </section>

        {/* Call-to-Action Section */}
        <section className="responsive-section" style={{
          padding: '80px 20px',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{
              backgroundColor: 'rgba(249, 243, 234,0.9)',
              padding: '60px 40px',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              margin: '0 auto'
            }}>
              <h2 style={{
                fontSize: '4rem',
                fontWeight: 'bold',
                color: '#8B4513',
                marginBottom: '24px',
                lineHeight: '1.2'
              }}>
                Ready to Grow Your Mehndi Career?
              </h2>
              <p style={{
                fontSize: '1.2rem',
                color: '#8B4513',
                marginBottom: '40px',
                lineHeight: '1.6',
                maxWidth: '600px',
                margin: '0 auto 40px auto'
              }}>
                Create your artist profile in minutes and start getting booked by clients who love your style.
              </p>
              <Link
                to="/signup"
                className="home__cta-button"
              >
                Get Started →
              </Link>
            </div>
          </div>
        </section>

        
      </main>
      <Footer />
    </>
  );
};

export default EarnAsArtist;
