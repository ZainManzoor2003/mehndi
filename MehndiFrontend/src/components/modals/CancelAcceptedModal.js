import React, { useEffect, useState } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';

// A small, themed modal for cancelling an already-accepted application.

const CancelAcceptedModal = ({
  isOpen,
  onClose,
  onConfirm,
  showReasonDropdown = true, // For artist side (true) vs client side (false)
}) => {
  const [reason, setReason] = useState('Other');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const CANCEL_REASONS = [
    'Scheduling Conflict',
    'Personal Emergency',
    'Travel / Location Issue',
    'Health Issues',
    'Other',
  ];

  useEffect(() => {
    if (isOpen) {
      setReason('Other');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    // For client side (no reason dropdown), only validate description
    if (!showReasonDropdown) {
      if (!description.trim()) {
        setError('Please provide a cancellation reason.');
        return;
      }
      setError('');
      if (typeof onConfirm === 'function') {
        onConfirm({ description: description.trim() });
      }
      return;
    }

    // For artist side (with reason dropdown)
    if (!reason) {
      setError('Please select a cancellation reason.');
      return;
    }
    if (reason === 'Other' && !description.trim()) {
      setError('Please provide additional details for "Other".');
      return;
    }
    setError('');
    if (typeof onConfirm === 'function') {
      onConfirm({
        reason: reason,
        description: description.trim() || null
      });
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
        {/* Header with icon and title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 24px 20px 24px',
          borderBottom: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaExclamationCircle style={{ fontSize: '24px', color: '#dc2626' }} />
            <h3 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: '#333'
            }}>
              Cancel Booking
            </h3>
          </div>
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
            This action <span style={{ color: '#dc2626', fontWeight: 700 }}>cannot be undone</span>. {showReasonDropdown ? 'The client' : 'The artist'} will be notified immediately.
          </p>
          <p style={{
            margin: '0 0 20px 0',
            fontSize: '14px',
            color: '#666',
            lineHeight: '1.6'
          }}>
            “Please note: All cancellations incur a 10% admin fee to cover payment processing and
            administrative costs.
            If you choose to rebook within 3 months with the same artist, we’ll waive this fee and apply
            your existing deposit to your new booking.”
          </p>

          {showReasonDropdown ? (
            <>
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
                  {CANCEL_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {reason === 'Other' && (
                <div style={{ marginBottom: '12px' }}>
                  <textarea
                    rows="4"
                    placeholder="Please provide additional details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
            </>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px'
              }}>
                Reason for cancellation (required):
              </label>
              <textarea
                rows="4"
                placeholder="e.g. I'm unwell, family emergency, scheduling conflict, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
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
              marginBottom: '16px',
              padding: '10px',
              backgroundColor: '#fee2e2',
              borderRadius: '6px'
            }}>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
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
                padding: '12px 24px',
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
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelAcceptedModal;


