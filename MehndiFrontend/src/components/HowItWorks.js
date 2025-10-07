import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Simple inline SVG icons to replace emojis
const ClientIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const ArtistIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M4 17l9-9 3 3-9 9H4v-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M13 8l2-2 3 3-2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState('artists');
  const [leafDecorations, setLeafDecorations] = useState([]);
  const mainRef = useRef(null);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const tabsRef = useRef(null);
  const pathRef = useRef(null);
  const stepsRef = useRef([]);
  const storyRef = useRef(null);

  // Effect for calculating leaf positions once the path is rendered
  useEffect(() => {
    if (pathRef.current) {
      const path = pathRef.current;
      const pathLength = path.getTotalLength();
      const decorations = [];
      
      // 1. Increased the number of leaves to 10 for a fuller look
      const leafPositions = [0.08, 0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78, 0.88, 0.95];

      leafPositions.forEach((pos, index) => {
        const pointLength = pathLength * pos;
        const point = path.getPointAtLength(pointLength);
        const nextPoint = path.getPointAtLength(pointLength + 1);

        const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
        
        // 2. Changed rotation from 90 to 55 degrees for a more natural angle
        const rotation = angle + (index % 2 === 0 ? 55 : -55);

        decorations.push({
          x: point.x,
          y: point.y,
          rotation: rotation
        });
      });
      
      setLeafDecorations(decorations);
    }
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      stepsRef.current = [];

      gsap.set([headerRef.current], { opacity: 0, y: 50 });

      gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
          onEnter: () => {
            gsap.to(headerRef.current, { opacity: 1, y: 0, duration: 1, ease: "power3.out" });
            if (pathRef.current) {
              const pathLength = pathRef.current.getTotalLength();
              gsap.set(pathRef.current, { strokeDasharray: pathLength, strokeDashoffset: pathLength, opacity: 0 });
              gsap.to(pathRef.current, { opacity: 1, strokeDashoffset: 0, duration: 2.5, ease: "power2.inOut", delay: 0.8 });
            }
            setTimeout(() => {
              stepsRef.current.forEach((step, index) => {
                if (step) {
                  gsap.fromTo(step,
                    { opacity: 0, scale: 0.3, y: 100, rotation: 15 },
                    { opacity: 1, scale: 1, y: 0, rotation: 0, duration: 1, ease: "back.out(1.7)", delay: index * 0.3 }
                  );
                }
              });
            }, 1200);
          },
          onLeave: () => {
            gsap.to([headerRef.current], { opacity: 0, y: -30, duration: 0.5, ease: "power2.in" });
          },
          onEnterBack: () => {
            gsap.to([headerRef.current], { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
          }
        }
      });
      
      if (storyRef.current) {
        const storyLines = gsap.utils.toArray('.story-line');
        storyLines.forEach((lineEl) => {
          if (!lineEl) return;
          
          const originalText = lineEl.textContent || '';
          lineEl.innerHTML = ''; 
          for (let char of originalText) {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            lineEl.appendChild(span);
          }
          
          const chars = Array.from(lineEl.querySelectorAll('span'));

          gsap.fromTo(chars,
            { color: 'var(--ad-muted, #6b5544)' },
            {
              color: 'var(--ad-text, #3f2c1e)',
              ease: 'none',
              stagger: { each: 0.02, from: 'start' },
              scrollTrigger: {
                trigger: lineEl,
                start: 'top 85%',
                end: 'bottom 60%',
                scrub: 0.5,
              }
            }
          );
        });
      }

      stepsRef.current.forEach((step) => {
        if (step) {
          step.addEventListener('mouseenter', () => {
            gsap.to(step, { 
              scale: 1.08, 
              y: -10,
              duration: 0.4, 
              ease: "power2.out",
              boxShadow: "0 20px 60px rgba(139, 115, 85, 0.3)"
            });
          });
          step.addEventListener('mouseleave', () => {
            gsap.to(step, { 
              scale: 1, 
              y: 0,
              duration: 0.4, 
              ease: "power2.out",
              boxShadow: "0 12px 40px rgba(139, 115, 85, 0.15)"
            });
          });
        }
      });

    }, mainRef);

    return () => ctx.revert();
  }, [activeTab]);

  const addToStepsRef = (el) => {
    if (el && !stepsRef.current.includes(el)) {
      stepsRef.current.push(el);
    }
  };
  
  const artistsSteps = [
    { number: 1, title: "Create Your Profile", description: "Add styles, coverage, portfolio, and pricing ranges.", icon: "👤" },
    { number: 2, title: "Discover Requests", description: "Browse client requests that match your expertise.", icon: "📧" },
    { number: 3, title: "Send Proposals", description: "Submit tailored offers with your pricing and availability.", icon: "💬" },
    { number: 4, title: "Get Booked", description: "Connect with clients and grow your business.", icon: "🔗" }
  ];

  const clientsSteps = [
    { number: 1, title: "Post Your Request", description: "Tell us the date, location, style, and coverage.", icon: "👤" },
    { number: 2, title: "Receive Offers", description: "Artists send tailored proposals with pricing ranges.", icon: "📧" },
    { number: 3, title: "Compare & Chat", description: "View portfolios, message artists, and refine details.", icon: "💬" },
    { number: 4, title: "Book Securely", description: "Confirm the artist you love and pay safely.", icon: "🔗" }
  ];

  const currentSteps = activeTab === 'artists' ? artistsSteps : clientsSteps;

  return (
    <div ref={mainRef}>
      {/* Origin Story Section */}
      <section className="origin-story" id="origin-story" ref={storyRef} style={{
        background: "#F5DEB3",
        color: "var(--ad-text)",
        padding: "6rem 0 3rem",
        borderBottom: "1px solid var(--ad-border)"
      }}>
        <div className="container" style={{ maxWidth: 980, margin: "0 auto", padding: "0 1.2rem" }}>
          <div className="origin-story__text" style={{ fontSize: "clamp(16px, 2.4vw, 26px)", lineHeight: 1.35, letterSpacing: "0.2px" }}>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--ad-text)' }}>A Global First, Born from Chaos</p>
            <p className="story-line" style={{ margin: "8px 0 0", fontSize: "clamp(16px, 2.4vw, 26px)" }}>In a world where plans can fall apart overnight, we built something to make sure yours don’t.</p>
            <p className="story-line" style={{ margin: "8px 0 0", fontSize: "clamp(16px, 2.4vw, 26px)" }}>Three days before my wedding, my mehndi artist cancelled.</p>
            <p className="story-line" style={{ margin: "8px 0 0", fontSize: "clamp(16px, 2.4vw, 26px)" }}>No design. No backup. No time.</p>
            <p className="story-line" style={{ margin: "8px 0 0", fontSize: "clamp(16px, 2.4vw, 26px)" }}>I thought it was just my bad luck—until I learned it happens to brides, families, planners, and even artists everywhere.</p>
            <p className="story-line" style={{ margin: "8px 0 0", fontSize: "clamp(16px, 2.6vw, 26px)" }}>That moment of panic became the spark for something the mehndi world had never seen before…</p>
            <div style={{ marginTop: "1.6rem" }}>
              <button type="button" className="origin-story__cta" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "999px",
                border: "1.5px solid var(--ad-primary)",
                color: "var(--ad-primary-600)",
                background: "radial-gradient(120% 120% at 0% 0%, rgba(207,127,58,0.10) 0%, rgba(207,127,58,0.06) 55%, rgba(207,127,58,0.02) 100%)",
                boxShadow: "0 0 0 0 rgba(207,127,58,0.25)",
                transition: "all .25s ease",
                cursor: 'pointer'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 10px 35px rgba(207,127,58,0.28)";
                  e.currentTarget.style.borderColor = "var(--ad-primary-600)";
                  e.currentTarget.style.background = "linear-gradient(180deg, rgba(207,127,58,0.18), rgba(207,127,58,0.10))";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 0 0 rgba(207,127,58,0.25)";
                  e.currentTarget.style.borderColor = "var(--ad-primary)";
                  e.currentTarget.style.background = "radial-gradient(120% 120% at 0% 0%, rgba(207,127,58,0.10) 0%, rgba(207,127,58,0.06) 55%, rgba(207,127,58,0.02) 100%)";
                }}
              >
                <span>Read what happened next →</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works" ref={sectionRef}>
        <div className="how-it-works__container container">
          <div className="how-it-works__tabs" ref={tabsRef}>
            <button 
              className={`how-it-works__tab ${activeTab === 'clients' ? 'active' : ''}`}
              onClick={() => setActiveTab('clients')}
            >
              <span className="tab-icon"><ClientIcon /></span>
              Clients
            </button>
            <button 
              className={`how-it-works__tab ${activeTab === 'artists' ? 'active' : ''}`}
              onClick={() => setActiveTab('artists')}
            >
              <span className="tab-icon"><ArtistIcon /></span>
              Artists
            </button>
          </div>

          <div className="how-it-works__header" ref={headerRef}>
            <h2 className="how-it-works__title">
              How It Works — For {activeTab === 'artists' ? 'Artists' : 'Clients'}
            </h2>
            <p className="how-it-works__subtitle">
              {activeTab === 'artists' 
                ? 'Build your mehndi business and connect with clients in four simple steps.'
                : 'Simple steps to find and book your perfect mehndi artist.'
              }
            </p>
          </div>

          <div className="how-it-works__flow">
            <svg className="how-it-works__path" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="vineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5E34"/>
                  <stop offset="50%" stopColor="#A4693D"/>
                  <stop offset="100%" stopColor="#7A4A24"/>
                </linearGradient>
                <filter id="leafShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#7A4A24" floodOpacity="0.25"/>
                </filter>
              </defs>
              <path
                ref={pathRef}
                className="vine-path"
                d="M 140,130 C 360,60 620,120 780,170 S 920,300 820,360 610,430 520,480 380,560 300,620 140,600 130,540 200,440 300,420 440,430 560,500 720,620 840,690"
                fill="none"
                stroke="url(#vineGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <g className="vine-decorations" filter="url(#leafShadow)" stroke="#A4693D" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                {leafDecorations.map((deco, index) => (
                  <g key={index} transform={`translate(${deco.x}, ${deco.y}) rotate(${deco.rotation})`}>
                    <line x1="0" y1="0" x2="0" y2="15" />
                    {/* 3. Increased leaf size by adjusting the SVG path data */}
                    <path d="M0 15 q 12 12 0 24 q -12 -12 0 -24 Z" fill="#F0E6D8"/>
                  </g>
                ))}
              </g>
            </svg>

            <div className="how-it-works__steps">
              {currentSteps.map((step) => (
                <div 
                  key={`${activeTab}-${step.number}`}
                  ref={addToStepsRef}
                  className={`how-it-works__step step-${step.number}`}
                >
                  <div className="step__circle-container">
                    <div className="step__circle">
                      <div className="step__number">{step.number}</div>
                      <div className="step__content-inside">
                        <h3 className="step__title-inside">{step.title}</h3>
                        <p className="step__description-inside">{step.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;