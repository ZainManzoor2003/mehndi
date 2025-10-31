import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const CLIENT_FAQS = [
  { q: 'How do I find a Mehndi artist near me?', a: 'Post your request with date and location. Artists near you will apply with offers, availability and portfolio links.' },
  { q: 'How do I make a booking?', a: 'Choose the artist you like, pay the deposit to confirm, and chat in-app to finalize details.' },
  { q: 'Can I cancel or reschedule my appointment?', a: 'Yes. You can manage the booking from your dashboard. Refunds depend on the event date and our policy.' },
  { q: 'Is payment made online or in person?', a: 'Your deposit is paid online. The remaining amount can be settled as agreed with your artist.' },
  { q: 'How do I leave a review for my artist?', a: 'After your event, go to Dashboard → Reviews and submit your rating and feedback.' }
];

const ARTIST_FAQS = [
  { q: 'How do I join as an artist?', a: 'Create an account, complete your profile with portfolio and pricing ranges, and submit for verification.' },
  { q: 'How do I apply to bookings?', a: 'Browse client requests on the dashboard and send a tailored proposal with price and availability.' },
  { q: 'How are payments handled?', a: 'The client pays a deposit to confirm. The remaining amount is paid as agreed. You can track everything in the dashboard.' },
  { q: 'Can I set travel distance?', a: 'Yes. Set “Available for travel” and your travel distance in km in your portfolio settings.' }
];

const Pill = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    background: active ? '#5C3D2E' : '#EDD6B3',
    color: active ? '#fff' : '#5C3D2E',
    border: 'none',
    padding: '12px 18px',
    borderRadius: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    marginRight: '10px'
  }}>{children}</button>
);

const FullFAQ = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('clients');
  const [query, setQuery] = useState('');
  const [openIdx, setOpenIdx] = useState(null);
  const contentRefs = useRef([]);
  const [heights, setHeights] = useState({});

  // Scroll to top quickly on mount
  useEffect(() => {
    try {
      window.scrollTo(0, 0);
    } catch {}
  }, []);

  const items = tab === 'clients' ? CLIENT_FAQS : ARTIST_FAQS;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q));
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
    <section style={{ padding: '150px 0 60px', scrollMarginTop: 100 }}>
      <div style={{ maxWidth: 980, margin: '0 auto',borderRadius:'12px', padding: '30px 16px', backgroundColor: 'rgb(246, 231, 205)' }}>
        <h1 style={{ textAlign: 'center', color: '#4A2C1D', fontSize: '42px', margin: 0 }}>Frequently Asked Questions</h1>
        <p style={{ textAlign: 'center', color: '#6b5544', marginTop: 8 }}>Find quick answers to common questions from our Mehndi Me community 🌿</p>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
          <Pill active={tab === 'clients'} onClick={() => { setTab('clients'); setOpenIdx(null); }}>For Clients</Pill>
          <Pill active={tab === 'artists'} onClick={() => { setTab('artists'); setOpenIdx(null); }}>For Artists</Pill>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
          <input
            placeholder="Search by keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%', maxWidth: 920,
              padding: '14px 16px',
              borderRadius: 14, border: '1px solid #edd6b3',
              background: '#FAE7C9'
            }}
          />
        </div>

        {/* List */}
        <div style={{ marginTop: 22, display: 'grid', gap: 12 }}>
          {filtered.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} style={{
                background: 'linear-gradient(90deg,#F2D6A6,#F0D0A1)',
                border: '1px solid #f0e0c8',
                borderRadius: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'transparent', border: 'none', padding: '20px 24px', cursor: 'pointer', color: '#4A2C1D', fontWeight: 700
                  }}
                  onMouseEnter={(e) => {
                    const qEl = e.currentTarget.querySelector('.full-faq-q');
                    if (qEl && qEl.style) qEl.style.color = 'var(--accent-orange, #D2691E)';
                  }}
                  onMouseLeave={(e) => {
                    const qEl = e.currentTarget.querySelector('.full-faq-q');
                    if (qEl && qEl.style) qEl.style.color = '#4A2C1D';
                  }}
                >
                  <span className="full-faq-q" style={{ color: '#4A2C1D', transition: 'color 0.25s ease' }}>{item.q}</span>
                  {isOpen ? (
                    <FaChevronUp style={{ color: 'var(--accent-orange, #D2691E)', transition: 'transform 0.6s ease' }} />
                  ) : (
                    <FaChevronDown style={{ color: 'var(--accent-orange, #D2691E)', transition: 'transform 0.6s ease' }} />
                  )}
                </button>
                <div
                  ref={(el) => (contentRefs.current[i] = el)}
                  style={{
                    maxHeight: isOpen ? `${heights[i] || 0}px` : '0px',
                    overflow: 'hidden',
                    transition: 'max-height 0.6s cubic-bezier(0.22, 1, 0.36, 1)'
                  }}
                >
                  <div style={{
                    padding: '0 24px 20px 24px',
                    color: '#654C3F',
                    lineHeight: '1.7',
                    fontSize: '1rem',
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? 'translateY(0)' : 'translateY(-4px)',
                    transition: 'opacity 0.6s ease, transform 0.6s ease'
                  }}>
                    {item.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Help box */}
        <div style={{
          marginTop: 28,
          background: '#F3E2BF',
          borderRadius: 14,
          border: '1px solid #f0e0c8',
          padding: '28px 20px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ color: '#4A2C1D', fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Still need help?</div>
          <p style={{ marginTop: 0, color: '#6b5544' }}>We’re a small team, but we love hearing from our community! If you can't find what you're looking for, send us a quick message and we'll get back to you soon</p>
          <button onClick={() => navigate('/contact')}
            style={{
              background: '#5C3D2E', color: '#fff', border: 'none',
              padding: '12px 24px', borderRadius: 14, fontWeight: 700, cursor: 'pointer',marginTop: '30px'
            }}>Contact Mehndi Me Team →</button>
        </div>
      </div>
    </section>
  );
};

export default FullFAQ;


