import React, { useState } from 'react';

const faqs = [
  { q: 'What is Mehndi Me?', a: 'A platform to connect clients with mehndi artists, manage bookings, and pay securely.' },
  { q: 'How do I request an artist?', a: 'Click Request an Artist on the home section, fill details, and receive proposals.' },
  { q: 'Is payment secure?', a: 'Yes. Payments are processed securely and released to artists as per policy.' },
  { q: 'Can artists join?', a: 'Absolutely. Create your artist profile and start receiving client requests.' },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="section" id="faq" style={{ background: 'var(--ad-bg)', color: 'var(--ad-text)' }}>
      <div className="container" style={{ maxWidth: 980, margin: '0 auto', padding: '0 1.2rem' }}>
        <h2 className="section__title" style={{ color: 'var(--ad-text)' }}>FAQ</h2>
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--ad-surface)',
                  border: '1px solid var(--ad-border)',
                  borderRadius: 12,
                  overflow: 'hidden'
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
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--ad-text)',
                    fontSize: '1rem' 
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{item.q}</span> 
                  <span aria-hidden style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .3s ease-out' }}>▼</span>
                </button>
                
                <div
                  style={{
                    maxHeight: isOpen ? '200px' : '0', 
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out',
                  }}
                >
                  <div style={{ padding: '0 16px 14px 16px', color: 'var(--ad-muted)' }}>
                    {item.a}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;