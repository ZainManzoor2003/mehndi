import React, { useState } from 'react';

const backdrop = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const card = { background: '#fff', borderRadius: 12, width: 'min(560px, 92vw)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' };
const head = { padding: '16px 18px', borderBottom: '1px solid #eee', fontWeight: 800, color: '#4A2C1D' };
const body = { padding: 18, color: '#374151', lineHeight: 1.6 };
const foot = { padding: 16, display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #eee' };
const btn = (bg, color = '#fff') => ({ background: bg, color, border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' });

const BrowseApplyModal = ({ open, onClose, onConfirm, busy = false, title = 'Apply to Booking', booking }) => {
  const [proposedBudget, setProposedBudget] = useState('');
  const [duration, setDuration] = useState('');
  const [message, setMessage] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  if (!open) return null;
  const validate = () => {
    const e = {};
    if (!proposedBudget || Number(proposedBudget) <= 0) e.proposedBudget = 'Enter a valid budget';
    if (!duration || Number(duration) <= 0) e.duration = 'Enter a valid duration';
    if (!message || message.trim().length < 20) e.message = 'Message must be at least 20 characters';
    if (!agreed) e.agreed = 'You must agree to the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  return (
    <div style={backdrop} onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div style={head}>{title}</div>
        <div style={{ padding: 0 }}>
          {booking && (
            <div style={{
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              margin: '20px',
              padding: '20px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ marginBottom: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#2c3e50', textAlign: 'left' }}>
                  {(booking.designStyle || 'Mehndi') + (booking.city || booking.location ? ` at ${booking.city || booking.location}` : '')}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6c757d' }}>
                  <span style={{ fontSize: 16 }}>💰</span>
                  <span>Client Budget: £{booking.minimumBudget}–£{booking.maximumBudget}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6c757d' }}>
                  <span style={{ fontSize: 16 }}>📍</span>
                  <span>Location: {booking.location || booking.city || 'Not specified'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6c757d' }}>
                  <span style={{ fontSize: 16 }}>📅</span>
                  <span>Event Date: {booking.eventDate ? new Date(booking.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={body}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Your Proposed Budget (£) *</label>
              <input type="number" value={proposedBudget} onChange={(e) => setProposedBudget(e.target.value)} min="0" step="0.01" style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #e5e7eb' }} />
              {errors.proposedBudget && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.proposedBudget}</div>}
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Estimated Duration (hours) *</label>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="0" step="0.5" style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #e5e7eb' }} />
              {errors.duration && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.duration}</div>}
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Proposal Message *</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Explain why you're a great fit..." style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #e5e7eb' }} />
            <small style={{ color: message.length < 20 ? '#dc2626' : '#16a34a' }}>{message.length}/20 characters minimum</small>
            {errors.message && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.message}</div>}
          </div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>I agree to MehndiMe’s Terms & Conditions and Privacy Policy, and understand platform-only communication.</span>
          </label>
          {errors.agreed && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.agreed}</div>}
        </div>
        <div style={foot}>
          <button onClick={onClose} disabled={busy} style={btn('#E5E7EB', '#111827')}>Cancel</button>
          <button onClick={() => { if (validate()) onConfirm({ proposedBudget, duration, message, agreed }); }} disabled={busy} style={btn('#b45309')}>{busy ? 'Applying...' : 'Confirm Apply'}</button>
        </div>
      </div>
    </div>
  );
};

export default BrowseApplyModal;


