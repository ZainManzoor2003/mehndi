import React, { useEffect, useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const faqs = [
  { q: 'How do I book a Mehndi artist?', a: 'Simply submit a request with your details. Verified artists will apply, and you can review their portfolios before choosing your favorite.' },
  { q: 'When do I pay for my booking?', a: 'You\'ll pay a small deposit once you select your artist. The remaining amount is due 14 days before your event, ensuring a secure, hassle-free process.' },
  { q: 'What if I need to cancel or reschedule?', a: 'No worries -- just update or cancel your booking from your dashboard. Your deposit is protected under our cancellation policy.' },
  { q: 'Are artists verified on Mehndi Me?', a: 'Yes. Every artist\'s ID and portfolio are carefully reviewed before they\'re approved to join our platform.' },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  // Scroll to top on mount
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);
  const navigate = useNavigate();

  const toggle = (idx) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="section" id="faq" style={{ color: 'var(--ad-text)', backgroundColor: '#E4C293', padding: '4rem 0' }}>
      <div className="container" style={{ maxWidth: 980, margin: '0 auto', padding: '0 1.2rem' }}>
        <h2 className="section__title" style={{
          fontSize: '3.5rem', color: 'var(--title-color)', textAlign: 'center',
          marginBottom: '1rem'
        }}>Questions about Mehndi Me</h2>
        <p style={{ textAlign: 'center', fontSize: '1.1rem', color: 'var(--ad-text)', marginBottom: '2.5rem' }}>
          Here are some common questions from our Mehndi community <span style={{ fontSize: '1.5rem' }}>🌿</span>
        </p>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                style={{
                  background: '#F0EAD8',
                  border: 'none',
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '20px 24px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#333',
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#C79F5B';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'var(--ad-text)';
                  }}
                >
                  <span style={{ color: 'var(--ad-text)', fontWeight: 600, transition: 'color 0.3s ease' }}>{item.q}</span>
                  {isOpen ? (
                    <FaChevronUp
                      style={{
                        color: '#C79F5B',
                        fontSize: '1rem',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                  ) : (
                    <FaChevronDown
                      style={{
                        color: '#C79F5B',
                        fontSize: '1rem',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                  )}
                </button>

                <div
                  style={{
                    maxHeight: isOpen ? '300px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div style={{
                    padding: '0 24px 20px 24px',
                    color: 'var(--ad-muted)',
                    lineHeight: '1.6',
                    fontSize: '1rem'
                  }}>
                    {item.a}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          onClick={() => navigate('/faq')}
          style={{
            backgroundColor: '#5C3D2E',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '999px',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer'
          }}
        >
          View All FAQs →
        </button>
      </div>
    </section>
  );
};

export default FAQ;