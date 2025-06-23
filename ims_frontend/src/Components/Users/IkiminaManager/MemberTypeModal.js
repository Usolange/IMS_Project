import React, { useState } from 'react';
import axios from 'axios';

export default function MemberTypeModal({ isOpen, onClose, onSuccess }) {
  const [typeName, setTypeName] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!typeName) return;

    try {
      await axios.post('http://localhost:5000/api/member-types', { member_type: typeName });
      setMessage('Type added successfully.');
      setTypeName('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setMessage('Failed to add type.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-form">
        <h3>Add Member Type</h3>
        {message && <div>{message}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter Member Type"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
          />
          <div className="modal-actions">
            <button type="submit">Save</button>
            <button type="button" className="cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
