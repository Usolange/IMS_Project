import React from 'react';

export default function ConfirmDeleteModal({ show, onClose, onConfirm, locationName }) {
  if (!show) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete <strong>{locationName || 'this location'}</strong>?</p>
        <div className="modal-buttons">
          <button onClick={onConfirm} className="btn-delete">Yes, Delete</button>
          <button onClick={onClose} className="btn-cancel">Cancel</button>
        </div>
      </div>
    </div>
  );
}
