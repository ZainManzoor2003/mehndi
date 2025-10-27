import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';

const AboutUs = () => {
  const responsive=`.hero-title {
  margin: 0 0 1.3rem 0;
  font-weight: 800;
  color: #4A4A4A;
  font-size: 3rem; /* default font size */
}

/* Media query for screens ≤ 767px */
@media (max-width: 767px) {
  .hero-title {
    font-size: 2.5rem;
  }
}`
  const storyRef = useRef(null);
  const navigate=useNavigate();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!storyRef.current) return;

    const ctx = gsap.context(() => {
      const storyLines = gsap.utils.toArray('.story-line');

      // Split all lines first and set the initial color
      const linesAsChars = storyLines.map((lineEl) => {
        if (!lineEl) return [];
        const originalText = lineEl.textContent || '';
        lineEl.innerHTML = '';
        for (let char of originalText) {
          const span = document.createElement('span');
          span.textContent = char === ' ' ? '\u00A0' : char;
          span.style.display = 'inline-block';
          lineEl.appendChild(span);
        }
        const chars = Array.from(lineEl.querySelectorAll('span'));
        gsap.set(chars, { color: 'var(--ad-muted, #6b5544)' });
        return chars;
      });

      // One master timeline so only one line highlights at a time
      const tl = gsap.timeline({ defaults: { ease: 'none' } });
      linesAsChars.forEach((chars) => {
        if (!chars || chars.length === 0) return;
        tl.to(chars, { color: 'var(--ad-text, #3f2c1e)', stagger: 0.008, duration: 0.4 }, '+=0');
      });

      ScrollTrigger.create({
        trigger: storyRef.current,
        start: 'top 70%',
        end: 'bottom 50%',
        scrub: 0.4,
        animation: tl,
        invalidateOnRefresh: true,
      });
    }, storyRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
    <style>{responsive}</style>
    <section className="origin-story" id="aboutus" ref={storyRef} style={{
      color: "var(--text-color)",
      padding: "6rem 0 3rem",
      borderBottom: "1px solid var(--ad-border)"
    }}>
      <div className="container" style={{ maxWidth: 980, margin: "0 auto", padding: "0 1.2rem" }}>
        <div className="origin-story__text" style={{ fontSize: "26px", textAlign: 'center', lineHeight: 1.35, letterSpacing: "0.2px" }}>
          <h1 className="hero-title">A Global First, Born from Chaos</h1>
          <p className="story-line" style={{ margin: "8px 0 1.3rem 0", fontSize: "20px" }}>In a world where plans can fall apart overnight, we built something to make sure yours don’t.</p>
          <p className="story-line" style={{ margin: "8px 0 1.3rem 0", fontSize: "20px" }}>Three days before my wedding, my mehndi artist cancelled.</p>
          <p className="story-line" style={{ margin: "8px 0 1.3rem 0", fontSize: "20px" }}>No design. No backup. No time.</p>
          <p className="story-line" style={{ margin: "8px 0 1.3rem 0", fontSize: "20px" }}>I thought it was just my bad luck—until I learned it happens to brides, families, planners, and even artists everywhere.</p>
          <p className="story-line" style={{ margin: "8px 0 1.3rem 0", fontSize: "20px" }}>That moment of panic became the spark for something the mehndi world had never seen before…</p>
          <div style={{ marginTop: "1.6rem" }}>
            <button type="button" className="home__cta-button" onClick={()=>navigate('/about-us')}>
              <span>Read what happened next →</span>
            </button>
          </div>
        </div>
      </div>
    </section>
    </>
  );
};

export default AboutUs;


