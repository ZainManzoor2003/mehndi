import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const PhoneVerify = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const email = query.get('email') || '';
  const phone = query.get('phone') || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('We have sent a 6-digit code to your phone number.');
  const [successModal, setSuccessModal] = useState(false);

  const fullCode = code.join('');

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const inputsRef = useRef([]);

  const handleChange = (value, idx) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...code];
    next[idx] = value;
    setCode(next);
    if (value && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setError('');
    setSending(true);
    try {
      await authAPI.sendPhoneCode(email);
      setSecondsLeft(30);
      setInfo('A new code has been sent to your phone.');
    } catch (e) {
      setError(e.message || 'Failed to resend code.');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (fullCode.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setSending(true);
    try {
      await authAPI.verifyPhoneCode(email, fullCode);
      setSuccessModal(true);
    } catch (e) {
      setError(e.message || 'Invalid code. Please try again.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    // Auto-send SMS when page opens
    (async () => {
      if (!email) return;
      try { await authAPI.sendPhoneCode(email); } catch {}
    })();
  }, [email]);

  return (
    <div className="auth-container" style={{ margin: '0 auto', height: '100vh' }}>
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <h2 className="auth-title" style={{ textAlign: 'center' }}>Verify Your Phone</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', marginTop: 0 }}>
          {info} <br />
          <span style={{ color: '#374151' }}>to</span> <strong>{phone || 'your phone'}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '18px 0' }}>
            {code.map((c, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={c}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                ref={(el) => (inputsRef.current[i] = el)}
                style={{
                  width: 48, height: 56, textAlign: 'center', fontSize: 22,
                  border: '2px solid #e5e7eb', borderRadius: 10
                }}
              />
            ))}
          </div>
          {error && <p style={{ color: '#b91c1c', textAlign: 'center' }}>{error}</p>}
          <button
            type="submit"
            disabled={sending || fullCode.length !== 6}
            className="auth-submit-btn"
            style={{ width: '100%', marginTop: 8 }}
          >
            Continue
          </button>
        </form>
        <button
          onClick={handleResend}
          disabled={secondsLeft > 0 || sending}
          style={{
            width: '100%', marginTop: 10, padding: '0.85rem 1rem', borderRadius: 10,
            border: '1px solid #e5e7eb', background: secondsLeft > 0 ? '#e5e7eb' : '#fff',
            cursor: secondsLeft > 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend Code'}
        </button>
      </div>

      {successModal && (
        <div className="admin_modal-overlay" onClick={() => setSuccessModal(false)}>
          <div
            className="admin_payment-modal"
            onClick={(e)=>e.stopPropagation()}
            style={{
              background: '#fffaf3',
              border: '1px solid #e7c89b'
            }}
          >
            <div
              className="admin_modal-header"
              style={{
                background: '#fef7ed',
                borderBottom: '1px solid #e7c89b'
              }}
            >
              <h2 className="admin_modal-title" style={{ color: '#6b5544' }}>Phone Verified</h2>
              <button
                className="admin_modal-close"
                onClick={() => setSuccessModal(false)}
                style={{ color: '#6b5544' }}
              >
                ×
              </button>
            </div>
            <div className="admin_modal-body" style={{ color: '#6b5544' }}>
              <p>Your phone number has been verified. You can now log in.</p>
              <div style={{ display:'flex', justifyContent:'flex-end', gap: '8px', marginTop:'12px' }}>
                <button
                  className="admin_btn"
                  onClick={() => navigate('/login')}
                  style={{
                    background: '#d4a574',
                    color: '#ffffff',
                    border: 'none'
                  }}
                  onMouseEnter={(e)=>{ e.currentTarget.style.background = '#b8945f'; }}
                  onMouseLeave={(e)=>{ e.currentTarget.style.background = '#d4a574'; }}
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneVerify;


