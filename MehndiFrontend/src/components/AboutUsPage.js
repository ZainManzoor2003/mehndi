import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

const AboutUsPage = () => {
  const [activeSection, setActiveSection] = useState(0);

  // Scroll tracking for section detection
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'story-1', 'story-2', 'story-3', 'values', 'how-it-works', 'team', 'contact'];
      const scrollPosition = window.scrollY + 200; // Offset for header

      for (let i = 0; i < sections.length; i++) {
        const element = document.getElementById(sections[i]);
        if (element) {
          const elementTop = element.offsetTop;
          const elementBottom = elementTop + element.offsetHeight;
          
          if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
            setActiveSection(i);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Word highlighting animation for second story
  useEffect(() => {
    const handleWordHighlight = () => {
      const secondStorySection = document.querySelector('#story-2');
      if (!secondStorySection) return;

      const rect = secondStorySection.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (isVisible) {
        const words = document.querySelectorAll('.highlight-word');
        const scrollProgress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
        
        // Determine which word should be highlighted based on scroll progress
        let highlightedIndex = -1;
        if (scrollProgress >= 0.6) {
          highlightedIndex = 2; // Third word
        } else if (scrollProgress >= 0.4) {
          highlightedIndex = 1; // Second word
        } else if (scrollProgress >= 0.25) {
          highlightedIndex = 0; // First word
        }
        
        // Apply highlighting to all words
        words.forEach((word, index) => {
          if (index === highlightedIndex) {
            word.style.color = 'var(--ad-text)';
          } else {
            word.style.color = 'var(--primary-brown)';
          }
        });
      }
    };

    window.addEventListener('scroll', handleWordHighlight);
    return () => window.removeEventListener('scroll', handleWordHighlight);
  }, []);
  // Scroll progress indicator component
  const ScrollProgressIndicator = () => {
    const sections = ['hero', 'story-1', 'story-2', 'story-3', 'values', 'how-it-works', 'team', 'contact'];
    
    return (
      <div style={{
        position: 'fixed',
        left: '30px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {sections.map((section, index) => (
          <div
            key={section}
            onClick={() => {
              const element = document.getElementById(section);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: activeSection === index ? 'var(--accent-gold)' : '#d1d5db',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: activeSection === index ? '0 0 10px rgba(212, 165, 116, 0.5)' : 'none',
              transform: activeSection === index ? 'scale(1.2)' : 'scale(1)'
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Header />
      <ScrollProgressIndicator />
      <main className="main" style={{ paddingTop: '6.5rem' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.2rem' }}>
          
          {/* Hero Section */}
          <section id="hero" style={{ 
            textAlign: 'center', 
            padding: '4rem 0',
            // backgroundColor: '#fff',
            // marginBottom: '4rem'
          }}>
            {/* Headlines */}
            <div style={{ marginBottom: '3rem' }}>
              <h1 style={{ 
                fontSize: '3.5rem', 
                color: 'var(--ad-text)', 
                marginBottom: '1rem',
                fontWeight: '700',
                lineHeight: '1.2'
              }}>
                Three days before my wedding...
              </h1>
              <p style={{ 
                fontSize: '1.5rem', 
                color: 'var(--ad-text)', 
                fontStyle: 'italic',
                fontWeight: '400',
                margin: 0
              }}>
                The message every bride dreads.
              </p>
            </div>

            {/* Message Box */}
            <div style={{
              maxWidth: '600px',
              margin: '0 auto',
              backgroundColor: '#fff',
              border: '2px solid var(--accent-gold)',
              borderRadius: '15px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              {/* Message Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--accent-gold)',
                backgroundColor: 'var(--warm-beige)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: 'var(--ad-surface-strong)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: 'white'
                  }}>
                    🌸
                  </div>
                  <span style={{ 
                    fontSize: '0.9rem', 
                    color: '#2b2118',
                    fontWeight: '500'
                  }}>
                    Message from an artist
                  </span>
                </div>
                <span style={{ 
                  fontSize: '0.9rem', 
                  color: '#2b2118',
                  fontWeight: '500'
                }}>
                  3 days before
                </span>
              </div>

              {/* Message Content */}
              <div style={{ padding: '1.5rem' }}>
                {/* First Message */}
                <div style={{
                  backgroundColor: '#f3f4f6',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  marginBottom: '1rem',
                  textAlign: 'left'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '1rem',
                    color: '#2b2118',
                    lineHeight: '1.5'
                  }}>
                    Hey — I can't do your booking anymore. Something's come up and I need to cancel your slot.
                  </p>
                </div>

                {/* Second Message */}
                <div style={{
                  backgroundColor: '#fef2f2',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  textAlign: 'left'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '1rem',
                    color: '#dc2626',
                    lineHeight: '1.5'
                  }}>
                    Also, deposits are non-refundable. Sorry, but I don't have anyone else to recommend.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Statistics Banner */}
          <section style={{ 
            textAlign: 'center', 
            marginBottom: '4rem'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: '#FFF8E1',
              padding: '1rem 2rem',
              borderRadius: '50px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              border: '1px solid #f0f0f0'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                </svg>
              </div>
              <span style={{
                fontSize: '1.1rem',
                color: '#6D4C41',
                fontWeight: '600'
              }}>
                87% of clients get matched within 24 hours
              </span>
            </div>
          </section>

          {/* Story Section 1 - Text Left, Image Right */}
          <section id="story-1" style={{ marginBottom: '4rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '3rem',
              alignItems: 'center'
            }}>
              <div>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1.2',
                  marginBottom: '1rem'
                }}>
                  My mehndi artist couldn't do my design...
                </p>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1.2',
                  marginBottom: '1.5rem'
                }}>
                  and she had to cancel for my family too.
                </p>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1.2',
                  marginBottom: '1rem'
                }}>
                  The henna cones were already bought. My
                </p>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1.2',
                  marginBottom: '1rem'
                }}>
                  family was in the other room, laughing and
                </p>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1.2'
                }}>
                  making plans.
                </p>
              </div>
              <div style={{ 
                background: '#fff', 
                padding: '2rem', 
                borderRadius: '15px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  backgroundColor: 'var(--light-beige)',
                  color: 'var(--ad-text)',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  Real Moment
                </div>
                <div style={{
                  height: '200px',
                  borderRadius: '10px',
                  marginTop: '2rem',
                  overflow: 'hidden'
                }}>
                  <img 
                    src="https://images.unsplash.com/photo-1680490964820-7afb13f2e35c?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                    alt="Henna cones prepared on a tray"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Story Section 2 - Image Left, Text Right */}
          <section id="story-2" style={{ marginBottom: '4rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '3rem',
              alignItems: 'center'
            }}>
              <div style={{ 
                background: '#fff', 
                padding: '2rem', 
                borderRadius: '15px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  backgroundColor: 'black',
                  color: 'white',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  Silence
                </div>
                <div style={{
                  height: '200px',
                  borderRadius: '10px',
                  marginTop: '2rem',
                  overflow: 'hidden'
                }}>
                  <img 
                    src="https://images.unsplash.com/photo-1680490964820-7afb13f2e35c?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                    alt="Beautiful mehndi design in progress"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </div>
              <div>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1.6',
                  marginBottom: '1rem'
                }}>
                  In an instant, my mind went silent.
                </p>
                <div style={{ 
                  fontSize: '2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1.4',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  <span 
                    className="highlight-word" 
                    data-word="No design"
                    style={{ 
                      transition: 'color 0.5s ease',
                      color: 'var(--primary-brown)'
                    }}
                  >
                    No design.
                  </span>
                  {' '}
                  <span 
                    className="highlight-word" 
                    data-word="No backup"
                    style={{ 
                      transition: 'color 0.5s ease',
                      color: 'var(--primary-brown)'
                    }}
                  >
                    No backup.
                  </span>
                  {' '}
                  <span 
                    className="highlight-word" 
                    data-word="No time"
                    style={{ 
                      transition: 'color 0.5s ease',
                      color: 'var(--primary-brown)'
                    }}
                  >
                    No time.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Story Section 3 - Text Left, Image Right */}
          <section id="story-3" style={{ marginBottom: '4rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '3rem',
              alignItems: 'center'
            }}>
              <div>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1',
                  marginBottom: '1rem'
                }}>
                  At first, I thought it was just my bad luck.
                </p>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1',
                  marginBottom: '1rem'
                }}>
                  But as I spoke to friends, planners, and
                </p>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1',
                  marginBottom: '1rem'
                }}>
                  artists, I realised it happens far too often —
                </p>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1',
                  marginBottom: '1.5rem'
                }}>
                  across cities, cultures, and celebrations.
                </p>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1',
                  marginBottom: '1rem'
                }}>
                  When this happens, once-in-a-lifetime
                </p>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1',
                  marginBottom: '1rem'
                }}>
                  moments are lost. The joy of the day turns
                </p>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1',
                  marginBottom: '1rem'
                }}>
                  into stress. And artists miss out on sharing
                </p>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1',
                  marginBottom: '1rem'
                }}>
                  their craft because there's no simple,
                </p>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: 'var(--ad-text)', 
                  lineHeight: '1'
                }}>
                  reliable way to connect at the right time.
                </p>
              </div>
              <div style={{ 
                background: '#fff', 
                padding: '2rem', 
                borderRadius: '15px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  backgroundColor: 'var(--accent-orange)',
                  color: 'white',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  Common Story
                </div>
                <div style={{
                  height: '200px',
                  borderRadius: '10px',
                  marginTop: '2rem',
                  overflow: 'hidden'
                }}>
                  <img 
                    src="https://images.unsplash.com/photo-1680490964820-7afb13f2e35c?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                    alt="Final mehndi design on wedding day"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Values Section */}
          <section id="values" style={{ 
            marginBottom: '4rem',
            textAlign: 'center',
            padding: '4rem 0'
          }}>
            <p style={{ 
              fontSize: '1.75rem', 
              color: '#8B4513', 
              lineHeight: '1.6',
              marginBottom: '2rem',
              // maxWidth: '90%',
              margin: '0 auto 2rem auto'
            }}>
              That moment of panic became the spark for something the mehndi world
              had never seen before —
            </p>
            <h2 style={{ 
              fontSize: '3rem', 
              color: 'var(--ad-text)', 
              fontWeight: 'bold',
              lineHeight: '1.2',
              // maxWidth: '900px',
              margin: '0 3rem '
            }}>
              A Global First: The World's First Platform
              Built for Mehndi.
            </h2>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" style={{ marginBottom: '4rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '2rem',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              {/* Card 1: Clients Post Requests */}
              <div style={{ 
                background: '#fff', 
                padding: '2rem', 
                borderRadius: '15px',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  background: '#FFF8E1', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  position: 'relative'
                }}>
                <span style={{fontSize: '2rem'}}>📝</span>
                </div>
                <h3 style={{ 
                  color: 'var(--ad-text)', 
                  marginBottom: '1rem',
                  fontSize: '1.3rem',
                  fontWeight: 'bold'
                }}>
                  Clients Post Requests
                </h3>
                <p style={{ 
                  color: '#666', 
                  lineHeight: '1.6',
                  fontSize: '1rem'
                }}>
                  Share your event, style, and budget in minutes.
                </p>
              </div>

              {/* Card 2: Artists Apply to You */}
              <div style={{ 
                background: '#fff', 
                padding: '2rem', 
                borderRadius: '15px',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  background: '#FFF8E1', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  position: 'relative'
                }}>
                  <span style={{fontSize: '2rem'}}>🎨</span>
                </div>
                <h3 style={{ 
                  color: 'var(--ad-text)', 
                  marginBottom: '1rem',
                  fontSize: '1.3rem',
                  fontWeight: 'bold'
                }}>
                  Artists Apply to You
                </h3>
                <p style={{ 
                  color: '#666', 
                  lineHeight: '1.6',
                  fontSize: '1rem'
                }}>
                  Compare portfolios and offers side-by-side.
                </p>
              </div>

              {/* Card 3: Book with Confidence */}
              <div style={{ 
                background: '#fff', 
                padding: '2rem', 
                borderRadius: '15px',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  background: '#FFF8E1', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  position: 'relative'
                }}>
                  <span style={{fontSize: '2rem'}}>🛡️</span>    
                </div>
                <h3 style={{ 
                  color: 'var(--ad-text)', 
                  marginBottom: '1rem',
                  fontSize: '1.3rem',
                  fontWeight: 'bold'
                }}>
                  Book with Confidence
                </h3>
                <p style={{ 
                  color: '#666', 
                  lineHeight: '1.6',
                  fontSize: '1rem'
                }}>
                  Fast, trusted, and stress-free — every time.
                </p>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section id="team" style={{ 
            marginBottom: '4rem',
            textAlign: 'center',
            // maxWidth: '800px',
            margin: '0 auto 4rem auto'
          }}>
            {/* Testimonial Quote */}
            <div style={{ 
              background: '#FFF8E1', 
              padding: '2.5rem', 
              borderRadius: '15px',
              textAlign: 'left',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: '2px solid #d4a574',
              marginBottom: '2rem'
            }}>
              <p style={{ 
                fontSize: '1.3rem', 
                color: 'var(--ad-text)', 
                lineHeight: '1.6',
                marginBottom: '1rem',
                fontStyle: 'italic'
              }}>
                "We posted our request on a Thursday night and had three verified artists apply by Friday morning. Booking was seamless."
              </p>
              <p style={{ 
                fontSize: '1rem', 
                color: 'var(--ad-text)', 
                fontWeight: '500'
              }}>
                — Zara & Imran, London
              </p>
            </div>

            {/* Green Informational Banner */}
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: 'var(--warm-beige)',
              padding: '1rem 2rem',
              borderRadius: '50px',
              border: '1px solid var(--accent-orange)'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                backgroundColor: 'var(--accent-orange)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              </div>
              <span style={{
                fontSize: '1rem',
                color: 'var(--ad-text)',
                fontWeight: '500'
              }}>
                Verified contact details and reviews keep bookings safe.
              </span>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" style={{ 
            padding: '4rem 2rem',
            textAlign: 'center',
            // backgroundColor: '#fff'
          }}>
            <h2 style={{ 
              fontSize: '2.65rem', 
              color: 'var(--ad-text)', 
              marginBottom: '1rem',
              fontWeight: 'bold',
              lineHeight: '1.2'
            }}>
              It's more than a booking platform — it's a movement to protect your vision, your celebration, and your art.
            </h2>
            <p style={{ 
              fontSize: '1.2rem', 
              color: 'var(--ad-text)', 
              marginBottom: '3rem',
              lineHeight: '1.6',
              // maxWidth: '800px',
              margin: '0 auto 3rem auto'
            }}>
              Whether you're a bride, a planner, a family member, or an artist — join us in shaping the future of mehndi.
            </p>
            <button style={{
              backgroundColor: 'var(--accent-orange)',
              color: 'white',
              border: 'none',
              padding: '1rem 2.5rem',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#804018';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--accent-orange)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            }}>
              Join the Movement
            </button>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
};

export default AboutUsPage;
