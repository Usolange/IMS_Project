import React, { useState } from 'react';
import axios from 'axios';
import '../../../CSS/ModalForm.css';

export default function MemberTypeModal({ isOpen, onClose, onSuccess }) {
  const [typeName, setTypeName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!typeName.trim()) {
      setMessage('❌ Member Type is required.');
      return;
    }

    if (typeName.trim().length < 3) {
      setMessage('❌ Member Type must be at least 3 characters.');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/memberTypeRoutes/newMemberType', {
        member_type: typeName.trim(),
        type_desc: description.trim()
      });

      setMessage('✅ Type added successfully.');
      setTypeName('');
      setDescription('');

      // Inform parent to refresh
      if (onSuccess) onSuccess();

      // Delay a bit before closing
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);
    } catch (err) {
      setMessage('❌ Failed to add type.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-form">
        <h3>Add Member Type</h3>
        {message && <div className="message">{message}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter Member Type"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
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
