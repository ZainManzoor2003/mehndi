import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const homeRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const textRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();

    // Set initial states
    gsap.set(
      [
        titleRef.current,
        subtitleRef.current,
        textRef.current,
        buttonRef.current,
      ],
      {
        opacity: 0,
        y: 50,
      }
    );

    // Animate elements in sequence
    tl.to(titleRef.current, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
    })
      .to(
        subtitleRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.5"
      )
      .to(
        textRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.4"
      )
      .to(
        buttonRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scale: 1,
        },
        "-=0.3"
      );
  }, []);

  return (
    <section
      className="home"
      id="home"
      ref={homeRef}
      style={{ background: "#E4C293 !important" }}
    >
      <div className="home__container container">
        <div className="home__content">
          <h1 className="home__title" ref={titleRef}>
            <span className="home__title-line">A Global First</span>
            <span className="home__title-line">
              A Platform Built For Mehndi.
            </span>
          </h1>

          <div className="home__description">
            <p className="home__text" ref={subtitleRef}>
              Say goodbye to DMs, no-shows, and endless scrolling.
            </p>
            <p className="home__text" ref={textRef}>
              Post your request with all the details, receive offers from mehndi
              artists, and
              <br />
              book with confidence — all in one place.
            </p>
          </div>

          <div className="home__actions">
            <Link to="/login" className="home__cta-button" ref={buttonRef}>
              Request an Artist
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
