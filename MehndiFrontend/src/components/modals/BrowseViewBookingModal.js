import React from 'react';

const modalBackdrop = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalCard = {
  maxWidth: '800px', maxHeight: '90vh', width: '95%', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column'
};

const BrowseViewBookingModal = ({ open, viewForm, onClose, onApply, onMessage, showApply = true, applied = false }) => {
  if (!open || !viewForm) return null;
  return (
    <div style={modalBackdrop} onClick={onClose}>
      <div style={modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '2rem 2.5rem 1.5rem', borderBottom: '1px solid #e8ddd4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '600', color: '#8B4513' }}>Booking Details</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '28px', color: '#8B4513', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Client</label>
              <div style={{ padding: '12px 16px', border: '1px solid #e0d5c9', borderRadius: '10px', fontSize: '1rem', background: '#faf8f5', color: '#8B4513', fontWeight: '500' }}>Verified Client</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Event Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                {[
                  { value: 'Wedding', emoji: '💍' },
                  { value: 'Eid', emoji: '🌙' },
                  { value: 'Party', emoji: '🎉' },
                  { value: 'Festival', emoji: '🎊' }
                ].map(opt => (
                  <div key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: `2px solid ${viewForm.eventType === opt.value ? '#CD853F' : '#e0d5c9'}`, borderRadius: '12px', background: viewForm.eventType === opt.value ? '#fff8f0' : '#faf8f5', transition: 'all 0.3s', position: 'relative' }}>
                    <span style={{ fontSize: '1.5rem' }}>{opt.emoji}</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opt.value}</span>
                    {viewForm.eventType === opt.value && (
                      <span style={{ position: 'absolute', right: '16px', color: '#CD853F', fontWeight: 'bold', fontSize: '1.3rem' }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
              {viewForm.otherEventType && (
                <div style={{ marginTop: '1rem', padding: '12px 16px', background: '#faf8f5', borderRadius: '10px', border: '1px solid #e0d5c9', fontSize: '0.95rem', color: '#8B4513' }}>Other: {viewForm.otherEventType}</div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Event Date</label>
              <div style={{ padding: '12px 16px', border: '1px solid #e0d5c9', borderRadius: '10px', fontSize: '1rem', background: '#faf8f5', color: '#8B4513' }}>{viewForm.eventDate ? new Date(viewForm.eventDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Preferred Time Slot</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                {[
                  { value: 'Morning', icon: '☀️' },
                  { value: 'Afternoon', icon: '🌤️' },
                  { value: 'Evening', icon: '🌙' },
                  { value: 'Flexible', icon: '🔄' }
                ].map(opt => (
                  <div key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: `2px solid ${viewForm.preferredTimeSlot === opt.value ? '#CD853F' : '#e0d5c9'}`, borderRadius: '12px', background: viewForm.preferredTimeSlot === opt.value ? '#fff8f0' : '#faf8f5', transition: 'all 0.3s', position: 'relative' }}>
                    <span style={{ fontSize: '1.5rem' }}>{opt.icon}</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opt.value}</span>
                    {viewForm.preferredTimeSlot === opt.value && (
                      <span style={{ position: 'absolute', right: '16px', color: '#CD853F', fontWeight: 'bold', fontSize: '1.3rem' }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Location / Postcode</label>
              <div style={{ padding: '12px 16px', border: '1px solid #e0d5c9', borderRadius: '10px', fontSize: '1rem', background: '#faf8f5', color: '#8B4513' }}>{viewForm.location || 'Not specified'}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Artist Travel Preference</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {[
                  { value: 'yes', text: 'Yes, come to my home', icon: '🚗' },
                  { value: 'no', text: 'No, I\'ll travel to the artist', icon: '🏡' },
                  { value: 'both', text: 'I\'m open to both', icon: '🤝' }
                ].map(opt => (
                  <div key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: `2px solid ${viewForm.artistTravelsToClient === opt.value ? '#CD853F' : '#e0d5c9'}`, borderRadius: '12px', background: viewForm.artistTravelsToClient === opt.value ? '#fff8f0' : '#faf8f5', transition: 'all 0.3s', position: 'relative' }}>
                    <span style={{ fontSize: '1.5rem' }}>{opt.icon}</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opt.text}</span>
                    {viewForm.artistTravelsToClient === opt.value && (
                      <span style={{ position: 'absolute', right: '16px', color: '#CD853F', fontWeight: 'bold', fontSize: '1.3rem' }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {viewForm.venueName && (
              <div>
                <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Venue Name</label>
                <div style={{ padding: '12px 16px', border: '1px solid #e0d5c9', borderRadius: '10px', fontSize: '1rem', background: '#faf8f5', color: '#8B4513' }}>{viewForm.venueName}</div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Style You're Looking For</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {['Bridal Mehndi', 'Party Mehndi', 'Festival Mehndi', 'Casual / Minimal Mehndi'].map(opt => (
                  <div key={opt} style={{ display: 'flex', alignItems: 'center', padding: '16px', border: `2px solid ${viewForm.designStyle === opt ? '#CD853F' : '#e0d5c9'}`, borderRadius: '12px', background: viewForm.designStyle === opt ? '#fff8f0' : '#faf8f5', transition: 'all 0.3s', position: 'relative' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{opt}</span>
                    {viewForm.designStyle === opt && (
                      <span style={{ position: 'absolute', right: '16px', color: '#CD853F', fontWeight: 'bold', fontSize: '1.3rem' }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {Array.isArray(viewForm.designInspiration) && viewForm.designInspiration.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Design Inspiration</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem', padding: '1rem', background: '#f9f9f9', borderRadius: '10px' }}>
                  {viewForm.designInspiration.map((url, idx) => (
                    <div key={idx} style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e0d5c9' }}>
                      <img src={url} alt={`Inspiration ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewForm.coveragePreference && (
              <div>
                <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Coverage Preference (for bridal)</label>
                <div style={{ padding: '12px 16px', border: '1px solid #e0d5c9', borderRadius: '10px', fontSize: '1rem', background: '#faf8f5', color: '#8B4513' }}>{viewForm.coveragePreference}</div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Budget Range</label>
              <div style={{ padding: '16px', border: '1px solid #e0d5c9', borderRadius: '10px', fontSize: '1rem', background: '#faf8f5', color: '#8B4513', fontWeight: '600' }}>£{viewForm.minimumBudget} - £{viewForm.maximumBudget}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Number of People</label>
              <div style={{ padding: '12px 16px', border: '1px solid #e0d5c9', borderRadius: '10px', fontSize: '1rem', background: '#faf8f5', color: '#8B4513' }}>{viewForm.numberOfPeople || 1} {viewForm.numberOfPeople === 1 ? 'person' : 'people'}</div>
            </div>

            {viewForm.additionalRequests && (
              <div>
                <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B4513' }}>Additional Requests</label>
                <div style={{ padding: '12px 16px', border: '1px solid #e0d5c9', borderRadius: '10px', fontSize: '1rem', background: '#faf8f5', color: '#8B4513', lineHeight: '1.5' }}>{viewForm.additionalRequests}</div>
              </div>
            )}
          </div>
        </div>
        <div style={{ flexShrink: 0, borderTop: '1px solid #e8ddd4', padding: '1.5rem 2.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', background: '#faf8f5' }}>
          <button onClick={onClose} style={{ padding: '14px 32px', fontSize: '1rem', fontWeight: '600', color: 'white', backgroundColor: '#CD853F', border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(205, 133, 63, 0.3)' }}>Close</button>
          {onMessage && (
            <button onClick={onMessage} style={{ padding: '14px 32px', fontSize: '1rem', fontWeight: '600', color: 'white', backgroundColor: '#A4693D', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>Message Client</button>
          )}
          {showApply && (
            <button onClick={onApply} disabled={applied} style={{ padding: '14px 32px', fontSize: '1rem', fontWeight: '600', color: 'white', backgroundColor: applied ? '#9ca3af' : '#b45309', border: 'none', borderRadius: '12px', cursor: applied ? 'not-allowed' : 'pointer' }}>{applied ? 'Already Applied' : 'Apply'}</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseViewBookingModal;


