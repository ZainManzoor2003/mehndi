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
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Confirm Cancellation</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <p className="modal-text">
          This action <span style={{ color: '#dc2626', fontWeight: 700 }}>cannot be undone</span>. The client will be notified immediately.
        </p>

        <div className="form-group">
          <label className="form-label">Reason for cancellation</label>
          <select className="form-input" value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {requiresDetails && (
          <div className="form-group">
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Additional details..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
            {error && <small style={{ color: '#dc2626' }}>{error}</small>}
          </div>
        )}

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Keep Booking</button>
          <button className="confirm-btn decline" onClick={handleConfirm}>Confirm Cancellation</button>
        </div>
      </div>
    </div>
  );
};

export default CancelAcceptedModal;


