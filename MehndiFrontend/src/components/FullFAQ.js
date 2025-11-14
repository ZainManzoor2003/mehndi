import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";

const CLIENT_FAQS = [
  {
    q: "How do I post a mehndi request?",
    a: "It's simple! Just share your event details including the date, location, number of people, preferred time, and budget — through our quick request form. Once your request is live, talented artists can view it, message you to discuss your needs, and send personalized proposals for you to review.",
  },
  {
    q: "How will I know when artists apply?",
    a: "You'll receive instant email notifications whenever an artist applies to your request. You can also view all applications in your dashboard, where you can browse artist profiles, portfolios, and reviews before deciding who feels like the right fit.",
  },
  {
    q: "Can I chat with artists before booking?",
    a: "Absolutely! You can message artists directly to discuss designs, timing, and pricing. Once you're both happy with the details, you can confirm the booking — all right in your dashboard.",
  },
  {
    q: "How do I confirm and pay for my booking?",
    a: "When you've found your perfect artist, simply accept their proposal and confirm the booking. To secure your date, you'll pay a 50% deposit upfront. The remaining 50% is due 14 days before your event. Payments are handled securely through our platform, and funds are released to the artist once the event is complete and marked as finished.",
  },
  {
    q: "What if I need to cancel or change my booking?",
    a: "If your plans change, you can cancel your booking anytime right from your dashboard. Refunds depend on how close your cancellation is to the event.\nCurrently, we don't support rescheduling — you'll need to cancel and create a new request instead.\nFor full details, see our (Client Cancellation Policy).",
  },
];

const ARTIST_FAQS = [
  {
    q: "How do I find and apply to requests?",
    a: 'Head to the "Browse Requests" section to explore client posts. You can filter by date, location, or type of service, chat with clients to agree on the details, then send a proposal directly through the platform.',
  },
  {
    q: "Do I need to pay to apply for requests?",
    a: "No, it's completely free to apply for requests and start connecting with clients. For a limited time, anyone who signs up within the next 3 months will also enjoy (0% commission for their first month) — keep 100% of what you earn while you get started.",
  },
  {
    q: "How do I get paid for bookings?",
    a: "Once a client confirms a booking, they pay a 50% deposit to secure the date. The remaining 50% is paid 14 days before the event. After the event is complete and marked as finished by the client, payment is released securely to your linked account.",
  },
  {
    q: "What happens if a client cancels?",
    a: "If a client cancels, your earnings will depend on how close the cancellation is to the event.\nYou'll always receive at least the non-refundable portion of the deposit based on our (Client Cancellation Policy). This ensures your time and commitment are respected.",
  },
  {
    q: "Can I showcase my work on Mehndi Me?",
    a: "Absolutely! You can upload photos and videos of your mehndi designs to your profile. A strong portfolio helps clients see your style and makes it easier for them to choose you for their event.",
  },
];

// Helper function to format answer text - makes text in parentheses bold and preserves line breaks
const formatAnswer = (text) => {
  // Split by newlines first
  const lines = text.split("\n");

  return lines.map((line, lineIdx) => {
    // Process each line to make text in parentheses bold
    const parts = [];
    const regex = /\(([^)]+)\)/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(line)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      // Add the bold text (without parentheses)
      parts.push(
        <strong
          key={`bold-${lineIdx}-${match.index}`}
          style={{ fontWeight: 700 }}
        >
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    // If no parts were added (empty line), add empty string
    if (parts.length === 0) {
      parts.push("");
    }

    return (
      <React.Fragment key={`line-${lineIdx}`}>
        {parts}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

// Simple inline SVG icons to match HowItWorks
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

const FullFAQ = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  // Default to "clients" if no tab parameter or invalid tab
  const initialTab = tabFromUrl === "artists" ? "artists" : "clients";
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState(null);
  const contentRefs = useRef([]);
  const [heights, setHeights] = useState({});

  // Update tab when URL parameter changes and scroll to top
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl === "artists" || tabFromUrl === "clients") {
      setTab(tabFromUrl);
    } else {
      setTab("clients"); // Default to clients
    }
    // Scroll to top when tab changes
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [searchParams]);

  // Scroll to top on mount
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  const items = tab === "clients" ? CLIENT_FAQS : ARTIST_FAQS;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    const map = {};
    contentRefs.current.forEach((node, i) => {
      if (node) {
        map[i] = node.scrollHeight;
      }
    });
    setHeights(map);
  }, [filtered, openIdx]);

  return (
    <section style={{ padding: "150px 0 60px", scrollMarginTop: 100 }}>
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          borderRadius: "12px",
          padding: "30px 16px",
          backgroundColor: "rgb(246, 231, 205)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#8B4513",
            fontSize: "42px",
            margin: 0,
          }}
        >
          Frequently Asked Questions
        </h1>
        <p style={{ textAlign: "center", color: "#8B4513", marginTop: 8 }}>
          Find quick answers to common questions from our Mehndi Me community 🌿
        </p>

        <div className="how-it-works__tabs" style={{ marginTop: 18 }}>
          <button
            className={`how-it-works__tab ${tab === "clients" ? "active" : ""}`}
            onClick={() => {
              setTab("clients");
              setSearchParams({ tab: "clients" });
              setOpenIdx(null);
              // Scroll to top when tab is clicked
              try {
                window.scrollTo({ top: 0, behavior: "smooth" });
              } catch {
                window.scrollTo(0, 0);
              }
            }}
          >
            <span className="tab-icon">
              <ClientIcon />
            </span>
            Clients
          </button>
          <button
            className={`how-it-works__tab ${tab === "artists" ? "active" : ""}`}
            onClick={() => {
              setTab("artists");
              setSearchParams({ tab: "artists" });
              setOpenIdx(null);
              // Scroll to top when tab is clicked
              try {
                window.scrollTo({ top: 0, behavior: "smooth" });
              } catch {
                window.scrollTo(0, 0);
              }
            }}
          >
            <span className="tab-icon">
              <ArtistIcon />
            </span>
            Artists
          </button>
        </div>

        {/* Search */}
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 18 }}
        >
          <input
            placeholder="Search by keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              maxWidth: 920,
              padding: "14px 16px",
              borderRadius: 14,
              border: "1px solid #edd6b3",
              background: "#FAE7C9",
            }}
          />
        </div>

        {/* List */}
        <div style={{ marginTop: 22, display: "grid", gap: 12 }}>
          {filtered.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                style={{
                  background: "linear-gradient(90deg,#F2D6A6,#F0D0A1)",
                  border: "1px solid #f0e0c8",
                  borderRadius: 14,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "transparent",
                    border: "none",
                    padding: "20px 24px",
                    cursor: "pointer",
                    color: "#4A2C1D",
                    fontWeight: 700,
                  }}
                  onMouseEnter={(e) => {
                    const qEl = e.currentTarget.querySelector(".full-faq-q");
                    if (qEl && qEl.style)
                      qEl.style.color = "var(--accent-orange, #D2691E)";
                  }}
                  onMouseLeave={(e) => {
                    const qEl = e.currentTarget.querySelector(".full-faq-q");
                    if (qEl && qEl.style) qEl.style.color = "#8B4513";
                  }}
                >
                  <span
                    className="full-faq-q"
                    style={{ color: "#8B4513", transition: "color 0.25s ease" }}
                  >
                    {item.q}
                  </span>
                  {isOpen ? (
                    <FaChevronUp
                      style={{
                        color: "var(--accent-orange, #D2691E)",
                        transition: "transform 0.6s ease",
                      }}
                    />
                  ) : (
                    <FaChevronDown
                      style={{
                        color: "var(--accent-orange, #D2691E)",
                        transition: "transform 0.6s ease",
                      }}
                    />
                  )}
                </button>
                <div
                  ref={(el) => (contentRefs.current[i] = el)}
                  style={{
                    maxHeight: isOpen ? `${heights[i] || 0}px` : "0px",
                    overflow: "hidden",
                    transition:
                      "max-height 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <div
                    style={{
                      padding: "0 24px 20px 24px",
                      color: "#8B4513",
                      lineHeight: "1.7",
                      fontSize: "1rem",
                      opacity: isOpen ? 1 : 0,
                      transform: isOpen ? "translateY(0)" : "translateY(-4px)",
                      transition: "opacity 0.6s ease, transform 0.6s ease",
                    }}
                  >
                    {formatAnswer(item.a)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Help box */}
        <div
          style={{
            marginTop: 28,
            background: "#F3E2BF",
            borderRadius: 14,
            border: "1px solid #f0e0c8",
            padding: "28px 20px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              color: "#8B4513",
              fontWeight: 700,
              fontSize: 20,
              marginBottom: 6,
            }}
          >
            Still need help?
          </div>
          <p style={{ marginTop: "20px", color: "#8B4513" }}>
            Still need help? We're a small team and love hearing from our
            community. Email us at{" "}
            <a
              href="mailto:team.mehndime@gmail.com"
              style={{
                color: "#8B4513",
                textDecoration: "underline",
                fontWeight: 600,
              }}
            >
              team.mehndime@gmail.com
            </a>{" "}
            and we'll get back to you soon.
          </p>

          {/* <button onClick={() => navigate('/contact')}
            style={{
              background: '#5C3D2E', color: '#fff', border: 'none',
              padding: '12px 24px', borderRadius: 14, fontWeight: 700, cursor: 'pointer',marginTop: '30px'
            }}>Contact Mehndi Me Team →</button> */}
        </div>
      </div>
    </section>
  );
};

export default FullFAQ;
