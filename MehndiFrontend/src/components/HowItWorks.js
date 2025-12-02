import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

// Simple inline SVG icons to replace emojis
const ClientIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const ArtistIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M4 17l9-9 3 3-9 9H4v-3z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M13 8l2-2 3 3-2 2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState("clients");
  const [leafDecorations, setLeafDecorations] = useState([]);
  const [standaloneFlower, setStandaloneFlower] = useState(null);
  const [mobileLeafDecorations, setMobileLeafDecorations] = useState([]);
  const navigate = useNavigate();
  const mainRef = useRef(null);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const tabsRef = useRef(null);
  const pathRef = useRef(null);
  const mobilePathRef = useRef(null);
  const stepsRef = useRef([]);
  const storyRef = useRef(null);

  // Effect for calculating leaf positions once the path is rendered
  useEffect(() => {
    if (pathRef.current) {
      const path = pathRef.current;
      const pathLength = path.getTotalLength();
      const decorations = [];

      // 1. Increased the number of leaves to 10 for a fuller look
      const leafPositions = [
        0.08, 0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78, 0.88, 0.95,
      ];

      leafPositions.forEach((pos, index) => {
        const pointLength = pathLength * pos;
        const point = path.getPointAtLength(pointLength);
        const nextPoint = path.getPointAtLength(pointLength + 1);

        const angle =
          Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) *
          (180 / Math.PI);

        // 2. Changed rotation from 90 to 55 degrees for a more natural angle
        const rotation = angle + (index % 2 === 0 ? 55 : -55);

        // Calculate flower position along the vine path, 60px away from leaf
        const flowerOffset = 60; // Distance along path from leaf
        const flowerPointLength = Math.min(
          pathLength,
          Math.max(0, pointLength + flowerOffset)
        );
        const flowerPoint = path.getPointAtLength(flowerPointLength);

        // Calculate angle at flower position for new leaf
        const flowerNextPoint = path.getPointAtLength(
          Math.min(flowerPointLength + 1, pathLength)
        );
        const flowerAngle =
          Math.atan2(
            flowerNextPoint.y - flowerPoint.y,
            flowerNextPoint.x - flowerPoint.x
          ) *
          (180 / Math.PI);

        // New leaf 70px to the right along vine path from flower, touching the vine
        const newLeafOffset = 70; // Distance along path from flower
        const newLeafPointLength = Math.min(
          pathLength,
          Math.max(0, flowerPointLength + newLeafOffset)
        );
        const newLeafPoint = path.getPointAtLength(newLeafPointLength);

        // Calculate angle at new leaf position for rotation
        const newLeafNextPoint = path.getPointAtLength(
          Math.min(newLeafPointLength + 1, pathLength)
        );
        const newLeafAngle =
          Math.atan2(
            newLeafNextPoint.y - newLeafPoint.y,
            newLeafNextPoint.x - newLeafPoint.x
          ) *
          (180 / Math.PI);

        // New leaf rotation - opposite direction of current leaf
        const isCurrentLeafPositive = index % 2 === 0; // Current leaf direction
        const newLeafRotation =
          newLeafAngle + (isCurrentLeafPositive ? -55 : 55);

        // Position new leaf on the vine (touching it)
        const newLeafX = newLeafPoint.x;
        const newLeafY = newLeafPoint.y;

        // Calculate position percentage along path for animation timing
        const leafProgress = pos; // 0 to 1
        const flowerProgress = flowerPointLength / pathLength; // 0 to 1
        const newLeafProgress = newLeafPointLength / pathLength; // Based on new leaf position

        decorations.push({
          x: point.x,
          y: point.y,
          rotation: rotation,
          flowerX: flowerPoint.x,
          flowerY: flowerPoint.y,
          newLeafX: newLeafX,
          newLeafY: newLeafY,
          newLeafRotation: newLeafRotation,
          leafProgress: leafProgress,
          flowerProgress: flowerProgress,
          newLeafProgress: newLeafProgress,
        });
      });

      // Add standalone flower between 2nd and 3rd leaf (positions 0.18 and 0.28)
      const flowerPosition = 0.15; // Middle point between 2nd and 3rd leaf
      const flowerPointLength = pathLength * flowerPosition;
      const standaloneFlowerPoint = path.getPointAtLength(flowerPointLength);

      setStandaloneFlower({
        x: standaloneFlowerPoint.x,
        y: standaloneFlowerPoint.y,
        progress: flowerPosition,
      });

      setLeafDecorations(decorations);
    }
  }, []);

  // Effect for calculating mobile leaf positions
  useEffect(() => {
    // Create a temporary SVG path element to calculate positions
    const tempSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    const tempPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    tempPath.setAttribute("d", "M 12,-50 L 88,20 L 12,80 L 82,140");
    tempSvg.appendChild(tempPath);
    document.body.appendChild(tempSvg);

    const pathLength = tempPath.getTotalLength();
    const decorations = [];

    // Same leaf positions as desktop but adjusted for mobile path
    const leafPositions = [
      0.08, 0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78, 0.88, 0.95,
    ];

    leafPositions.forEach((pos, index) => {
      const pointLength = pathLength * pos;
      const point = tempPath.getPointAtLength(pointLength);
      const nextPoint = tempPath.getPointAtLength(
        Math.min(pointLength + 1, pathLength)
      );

      const angle =
        Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) *
        (180 / Math.PI);

      // Same rotation logic as desktop - alternate direction
      const rotation = angle + (index % 2 === 0 ? 55 : -55);

      // Calculate flower position 25px along the vine from leaf
      const flowerOffset = -3; // 25px distance from leaf
      const flowerPointLength = Math.min(
        pathLength,
        Math.max(0, pointLength + flowerOffset)
      );
      const flowerPoint = tempPath.getPointAtLength(flowerPointLength);

      decorations.push({
        x: point.x,
        y: point.y,
        rotation: rotation,
        flowerX: flowerPoint.x,
        flowerY: flowerPoint.y,
        progress: pos,
        flowerProgress: flowerPointLength / pathLength,
      });
    });

    document.body.removeChild(tempSvg);
    setMobileLeafDecorations(decorations);
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
          invalidateOnRefresh: true,
          onEnter: () => {
            if (!headerRef.current) return;
            gsap.to(headerRef.current, {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: "power3.out",
            });
            if (pathRef.current) {
              const pathLength = pathRef.current.getTotalLength();
              gsap.set(pathRef.current, {
                strokeDasharray: pathLength,
                strokeDashoffset: pathLength,
                opacity: 0,
              });

              // Create timeline for vine and decorations
              const vineTimeline = gsap.timeline({ delay: 0.8 });

              vineTimeline.to(pathRef.current, {
                opacity: 1,
                strokeDashoffset: 0,
                duration: 2.5,
                ease: "power2.inOut",
              });

              // Animate leaves and flowers progressively as vine draws
              leafDecorations.forEach((deco, index) => {
                // Animate leaf when vine reaches its position
                const leafGroup = document.querySelector(
                  `.leaf-group-${index}`
                );
                if (leafGroup) {
                  gsap.set(leafGroup, { opacity: 0, scale: 0 });
                  vineTimeline.to(
                    leafGroup,
                    {
                      opacity: 1,
                      scale: 1,
                      duration: 0.3,
                      ease: "back.out(1.7)",
                    },
                    deco.leafProgress * 2.5 // Start when vine reaches this position
                  );
                }

                // Animate flower when vine reaches its position
                const flowerGroup = document.querySelector(
                  `.flower-group-${index}`
                );
                if (flowerGroup) {
                  gsap.set(flowerGroup, { opacity: 0, scale: 0 });
                  vineTimeline.to(
                    flowerGroup,
                    {
                      opacity: 1,
                      scale: 1,
                      duration: 0.3,
                      ease: "back.out(1.7)",
                    },
                    deco.flowerProgress * 2.5 // Start when vine reaches this position
                  );
                }

                // Animate new leaf next to flower when vine reaches its position
                const newLeafGroup = document.querySelector(
                  `.new-leaf-group-${index}`
                );
                if (newLeafGroup && deco.newLeafX && deco.newLeafY) {
                  gsap.set(newLeafGroup, { opacity: 0, scale: 0 });
                  vineTimeline.to(
                    newLeafGroup,
                    {
                      opacity: 1,
                      scale: 1,
                      duration: 0.3,
                      ease: "back.out(1.7)",
                    },
                    deco.newLeafProgress * 2.5 // Start when vine reaches this position
                  );
                }
              });

              // Animate standalone flower between 2nd and 3rd leaf
              if (standaloneFlower) {
                const standaloneFlowerGroup =
                  document.querySelector(`.standalone-flower`);
                if (standaloneFlowerGroup) {
                  gsap.set(standaloneFlowerGroup, { opacity: 0, scale: 0 });
                  vineTimeline.to(
                    standaloneFlowerGroup,
                    {
                      opacity: 1,
                      scale: 1,
                      duration: 0.3,
                      ease: "back.out(1.7)",
                    },
                    standaloneFlower.progress * 2.5 // Start when vine reaches this position
                  );
                }
              }
            }

            // Animate mobile vine flowers only
            if (window.innerWidth <= 480 && mobilePathRef.current) {
              const mobileVineTimeline = gsap.timeline({ delay: 0.8 });

              // Animate mobile flowers progressively as vine draws
              mobileLeafDecorations.forEach((deco, index) => {
                // Animate flower when vine reaches its position
                const mobileFlowerGroup = document.querySelector(
                  `.mobile-flower-group-${index}`
                );
                if (mobileFlowerGroup) {
                  gsap.set(mobileFlowerGroup, { opacity: 0, scale: 0 });
                  mobileVineTimeline.to(
                    mobileFlowerGroup,
                    {
                      opacity: 1,
                      scale: 1,
                      duration: 0.3,
                      ease: "back.out(1.7)",
                    },
                    deco.flowerProgress * 2.5
                  );
                }
              });
            }

            setTimeout(() => {
              stepsRef.current.forEach((step, index) => {
                if (step) {
                  gsap.fromTo(
                    step,
                    { opacity: 0, scale: 0.3, y: 100, rotation: 15 },
                    {
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      rotation: 0,
                      duration: 1,
                      ease: "back.out(1.7)",
                      delay: index * 0.3,
                    }
                  );
                }
              });
            }, 1200);
          },
          onLeave: () => {
            if (!headerRef.current) return;
            gsap.to([headerRef.current], {
              opacity: 0,
              y: -30,
              duration: 0.5,
              ease: "power2.in",
            });
          },
          onEnterBack: () => {
            if (!headerRef.current) return;
            gsap.to([headerRef.current], {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
            });
          },
        },
      });

      if (storyRef.current) {
        const storyLines = gsap.utils.toArray(".story-line");
        storyLines.forEach((lineEl) => {
          if (!lineEl) return;

          const originalText = lineEl.textContent || "";
          lineEl.innerHTML = "";
          for (let char of originalText) {
            const span = document.createElement("span");
            span.textContent = char === " " ? "\u00A0" : char;
            span.style.display = "inline-block";
            lineEl.appendChild(span);
          }

          const chars = Array.from(lineEl.querySelectorAll("span"));

          gsap.fromTo(
            chars,
            { color: "var(--ad-muted, #6b5544)" },
            {
              color: "var(--ad-text, #3f2c1e)",
              ease: "none",
              stagger: { each: 0.02, from: "start" },
              scrollTrigger: {
                trigger: lineEl,
                start: "top 85%",
                end: "bottom 60%",
                scrub: 0.5,
                invalidateOnRefresh: true,
              },
            }
          );
        });
      }

      stepsRef.current.forEach((step) => {
        if (step) {
          step.addEventListener("mouseenter", () => {
            gsap.to(step, {
              scale: 1.08,
              y: -10,
              duration: 0.4,
              ease: "power2.out",
              boxShadow: "0 20px 60px rgba(139, 115, 85, 0.3)",
            });
          });
          step.addEventListener("mouseleave", () => {
            gsap.to(step, {
              scale: 1,
              y: 0,
              duration: 0.4,
              ease: "power2.out",
              boxShadow: "0 12px 40px rgba(139, 115, 85, 0.15)",
            });
          });
        }
      });
    }, mainRef);

    return () => {
      try {
        ctx.revert();
      } catch {}
      try {
        ScrollTrigger.getAll().forEach((t) => t.kill());
      } catch {}
    };
  }, [activeTab, leafDecorations, standaloneFlower, mobileLeafDecorations]);

  const addToStepsRef = (el) => {
    if (el && !stepsRef.current.includes(el)) {
      stepsRef.current.push(el);
    }
  };

  const artistsSteps = [
    {
      number: 1,
      title: "Create Your Profile",
      description: "Add styles, coverage, portfolio, and pricing ranges.",
      icon: "👤",
    },
    {
      number: 2,
      title: "Discover Requests",
      description: "Browse client requests that match your expertise.",
      icon: "📧",
    },
    {
      number: 3,
      title: "Send Proposals",
      description: "Submit tailored offers with your pricing and availability.",
      icon: "💬",
    },
    {
      number: 4,
      title: "Get Booked",
      description: "Connect with clients and grow your business.",
      icon: "🔗",
    },
  ];

  const clientsSteps = [
    {
      number: 1,
      title: "Post Your Request",
      description: "Tell us the date, location, style, and coverage.",
      icon: "👤",
    },
    {
      number: 2,
      title: "Receive Offers",
      description: "Artists send tailored proposals with pricing ranges.",
      icon: "📧",
    },
    {
      number: 3,
      title: "Compare & Chat",
      description: "View portfolios, message artists, and refine details.",
      icon: "💬",
    },
    {
      number: 4,
      title: "Book Securely",
      description: "Confirm the artist you love and pay safely.",
      icon: "🔗",
    },
  ];

  const currentSteps = activeTab === "artists" ? artistsSteps : clientsSteps;

  return (
    <div ref={mainRef} style={{ background: "#8B7355 !important" }}>
      {/* Origin story moved to AboutUs component */}

      <section className="how-it-works" id="how-it-works" ref={sectionRef}>
        <div className="how-it-works__container container">
          <div className="how-it-works__tabs" ref={tabsRef}>
            <button
              className={`how-it-works__tab ${
                activeTab === "clients" ? "active" : ""
              }`}
              onClick={() => setActiveTab("clients")}
            >
              <span className="tab-icon">
                <ClientIcon />
              </span>
              Clients
            </button>
            <button
              className={`how-it-works__tab ${
                activeTab === "artists" ? "active" : ""
              }`}
              onClick={() => setActiveTab("artists")}
            >
              <span className="tab-icon">
                <ArtistIcon />
              </span>
              Artists
            </button>
          </div>

          <div className="how-it-works__header" ref={headerRef}>
            <h2 className="how-it-works__title">
              How It Works — For{" "}
              {activeTab === "artists" ? "Artists" : "Clients"}
            </h2>
            <p className="how-it-works__subtitle">
              {activeTab === "artists"
                ? "Build your mehndi business and connect with clients in four simple steps."
                : "Simple steps to find and book your perfect mehndi artist."}
            </p>
          </div>

          <div className="how-it-works__flow">
            {/* Desktop Vine Path */}
            <svg
              className="how-it-works__path how-it-works__path-desktop"
              viewBox="0 0 1000 700"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient
                  id="vineGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#916D2C" />
                  <stop offset="50%" stopColor="#916D2C" />
                  <stop offset="100%" stopColor="#916D2C" />
                </linearGradient>
                <filter
                  id="leafShadow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feDropShadow
                    dx="0"
                    dy="1"
                    stdDeviation="1"
                    floodColor="#916D2C"
                    floodOpacity="0.25"
                  />
                </filter>
              </defs>
              <path
                ref={pathRef}
                className="vine-path"
                d="M 140,130 C 360,60 620,120 780,170 S 920,300 820,360 610,430 520,480 380,560 300,620 140,600 130,540 200,440 300,420 440,430 560,500 720,620 840,690"
                fill="none"
                stroke="#916D2C"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <g
                className="vine-decorations"
                filter="url(#leafShadow)"
                stroke="#916D2C"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {leafDecorations.map((deco, index) => (
                  <g key={index}>
                    {/* Leaf */}
                    <g
                      className={`leaf-group-${index}`}
                      transform={`translate(${deco.x}, ${deco.y}) rotate(${deco.rotation})`}
                      style={{ opacity: 0 }}
                    >
                      <line x1="0" y1="0" x2="0" y2="15" />
                      {/* 3. Increased leaf size by adjusting the SVG path data */}
                      <path
                        d="M0 15 q 12 12 0 24 q -12 -12 0 -24 Z"
                        fill="#F0E6D8"
                      />
                    </g>
                  </g>
                ))}
              </g>
              {/* New leaves next to flowers - outside filtered group */}
              {leafDecorations.map((deco, index) =>
                deco.newLeafX && deco.newLeafY ? (
                  <g
                    key={`new-leaf-${index}`}
                    className={`new-leaf-group-${index}`}
                    transform={`translate(${deco.newLeafX}, ${deco.newLeafY}) rotate(${deco.newLeafRotation})`}
                    style={{ opacity: 0 }}
                    stroke="#916D2C"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {/* Stem going upward toward vine */}
                    <line x1="0" y1="0" x2="0" y2="-10" />
                    {/* Leaf pointing upward */}
                    <path
                      d="M0 -10 q 12 -12 0 -24 q -12 12 0 24 Z"
                      fill="#F0E6D8"
                    />
                  </g>
                ) : null
              )}
              {/* Flowers next to leaves - outside filtered group for clarity */}
              {leafDecorations.map((deco, index) =>
                deco.flowerX && deco.flowerY ? (
                  <g
                    key={`flower-${index}`}
                    className={`flower-group-${index}`}
                    style={{ opacity: 0 }}
                  >
                    <image
                      href="/images/flwr.png"
                      x={deco.flowerX - 35}
                      y={deco.flowerY - 35}
                      width="70"
                      height="70"
                      preserveAspectRatio="xMidYMid meet"
                    />
                  </g>
                ) : null
              )}
              {/* Standalone flower between 2nd and 3rd leaf */}
              {standaloneFlower && (
                <g className="standalone-flower" style={{ opacity: 0 }}>
                  <image
                    href="/images/flwr.png"
                    x={standaloneFlower.x - 35}
                    y={standaloneFlower.y - 35}
                    width="70"
                    height="70"
                    preserveAspectRatio="xMidYMid meet"
                  />
                </g>
              )}
            </svg>

            {/* Mobile Vine Path - Single line connecting steps 1-2-3-4 */}
            <svg
              className="how-it-works__path how-it-works__path-mobile"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient
                  id="vineGradientMobile"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#916D2C" />
                  <stop offset="50%" stopColor="#916D2C" />
                  <stop offset="100%" stopColor="#916D2C" />
                </linearGradient>
                <filter
                  id="leafShadowMobile"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feDropShadow
                    dx="0"
                    dy="1"
                    stdDeviation="1"
                    floodColor="#916D2C"
                    floodOpacity="0.25"
                  />
                </filter>
              </defs>
              {/* Single continuous line: Step 1 (left) -> Step 2 (right) -> Step 3 (left) -> Step 4 (right) */}
              <path
                ref={mobilePathRef}
                className="vine-path-mobile"
                d="M 12,-50 
                   L 88,20
                   L 12,80
                   L 82,140"
                fill="none"
                stroke="#916D2C"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* Mobile Vine Decorations - Flowers only (25px spacing) */}
              {mobileLeafDecorations.map((deco, index) =>
                deco.flowerX && deco.flowerY ? (
                  <g
                    key={`mobile-flower-${index}`}
                    className={`mobile-flower-group-${index}`}
                    style={{ opacity: 0 }}
                  >
                    <image
                      href="/images/flwr.png"
                      x={deco.flowerX - 6}
                      y={deco.flowerY - 6}
                      width="14"
                      height="14"
                      preserveAspectRatio="xMidYMid meet"
                    />
                  </g>
                ) : null
              )}
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
                        <p className="step__description-inside">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* CTA Buttons based on active tab */}
        <div className="customDiv">
          {activeTab === "clients" ? (
            <div>
              <button
                onClick={() => navigate("/booking")}
                className="home__cta-button"
              >
                Post Your Mehndi Request
              </button>
              <div style={{ marginTop: "10px", color: "#6b6b6b" }}>
                It only takes 2 minutes — get offers today.
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={() => navigate("/signup")}
                className="home__cta-button"
              >
                Join as an Artist
              </button>
              <div style={{ marginTop: "10px", color: "#6b6b6b" }}>
                Sign up today — 0% commission for your first month.
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
