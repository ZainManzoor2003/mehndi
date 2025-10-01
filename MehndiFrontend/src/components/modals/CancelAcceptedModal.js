import React, { useEffect, useMemo, useState } from 'react';

// A small, themed modal for cancelling an already-accepted application.
// Uses shared modal styles from App.css: .modal-overlay, .confirmation-modal,
// .modal-header, .modal-title, .modal-close, .modal-text, .form-group,
// .form-input, .form-textarea, .modal-actions, .cancel-btn, .confirm-btn.decline

const REASONS = [
  'Scheduling Conflict',
  'Personal Emergency',
  'Travel / Location Issue',
  'Other',
];

const CancelAcceptedModal = ({
  isOpen,
  onClose,
  onConfirm,
  initialReason = 'Other',
}) => {
  const [reason, setReason] = useState(initialReason);
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');

  const requiresDetails = useMemo(() => reason === 'Other', [reason]);

  useEffect(() => {
    if (isOpen) {
      setReason(initialReason || 'Other');
      setDetails('');
      setError('');
    }
  }, [isOpen, initialReason]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason) {
      setError('Please provide a cancellation reason.');
      return;
    }
    if (requiresDetails && !details.trim()) {
      setError('Please provide additional details for "Other".');
      return;
    }
    setError('');
    if (typeof onConfirm === 'function') {
      onConfirm({ reason, details: details.trim() });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '560px',
        width: '90%',
        padding: '0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        {/* Header with aligned title and close button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 24px 20px 24px',
          borderBottom: 'none'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: '#333'
          }}>
            Confirm Cancellation
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              color: '#999',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '0 24px 24px 24px' }}>
          <p style={{
            margin: '0 0 20px 0',
            fontSize: '14px',
            color: '#666',
            lineHeight: '1.6'
          }}>
            This action <span style={{ color: '#dc2626', fontWeight: 700 }}>cannot be undone</span>. The client will be notified immediately.
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px'
            }}>
              Reason for cancellation
            </label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#333',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {requiresDetails && (
            <div style={{ marginBottom: '12px' }}>
              <textarea
                rows="4"
                placeholder="Additional details..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#333',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
            </div>
          )}

          {error && (
            <div style={{ 
              fontSize: '13px', 
              color: '#dc2626',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
            justifyContent: 'right',
          }}>
          <button className="cancel-btn" onClick={onClose}>Keep Booking</button>
          <button className="confirm-btn decline" onClick={handleConfirm}>Confirm Cancellation</button>
            {/* <button 
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#666',
                backgroundColor: '#f5f5f5',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#e5e5e5'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#f5f5f5'}
            >
              Keep Booking
            </button>
            <button 
              onClick={handleConfirm}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: '#dc2626',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
            >
              Confirm Cancellation
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelAcceptedModal;


