import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const AboutUs = () => {
  const storyRef = useRef(null);

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
    <section className="origin-story" id="aboutus" ref={storyRef} style={{
      color: "var(--text-color)",
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
  );
};

export default AboutUs;


