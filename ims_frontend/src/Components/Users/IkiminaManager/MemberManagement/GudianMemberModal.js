import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../CSS/ModalForm.css'

export default function GudianMemberModal({ isOpen, onClose, onSuccess, editGudian }) {
  const [formData, setFormData] = useState({
    gm_names: '',
    gm_Nid: '',
    gm_phonenumber: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ikiId, setIkiId] = useState(null);

  // Set logged-in user id once
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) {
      setIkiId(user.id);
    } else {
      setError('No logged-in user found. Please log in.');
    }
  }, []);

  // When modal opens or editGudian changes, populate or reset form
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      if (editGudian) {
        setFormData({
          gm_names: editGudian.gm_names || '',
          gm_Nid: editGudian.gm_Nid || '',
          gm_phonenumber: editGudian.gm_phonenumber || '',
        });
      } else {
        setFormData({ gm_names: '', gm_Nid: '', gm_phonenumber: '' });
      }
    }
  }, [isOpen, editGudian]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!ikiId) {
      setError('No logged-in user found. Please log in.');
      return;
    }

    const { gm_names, gm_Nid, gm_phonenumber } = formData;
    if (!gm_names || !gm_Nid || !gm_phonenumber) {
      setError('All fields are required.');
      return;
    }

    try {
      if (editGudian) {
        // Edit mode - send PUT request
        const res = await axios.put(
          `http://localhost:5000/api/gudianMembersRoutes/${editGudian.gm_id}`, 
          {
            ...formData,
            iki_id: ikiId,
          }
        );
        setSuccess(res.data.message || 'Guardian member updated!');
      } else {
        // Add mode - send POST request
        const res = await axios.post(
          'http://localhost:5000/api/gudianMembersRoutes/newGudianMember', 
          {
            ...formData,
            iki_id: ikiId,
          }
        );
        setSuccess(res.data.message || 'Guardian member added!');
        setFormData({ gm_names: '', gm_Nid: '', gm_phonenumber: '' });
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-form">
        <h2>{editGudian ? 'Edit Guardian Member' : 'New Guardian Member'}</h2>

        {error && <div className="erroor">{error}</div>}
        {success && <div className="successs">{success}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="gm_names"
            placeholder="Full Name"
            value={formData.gm_names}
            onChange={handleChange}
          />
          <input
            type="text"
            name="gm_Nid"
            placeholder="National ID"
            value={formData.gm_Nid}
            onChange={handleChange}
            disabled={!!editGudian} // disable editing NID if editing (optional)
          />
          <input
            type="text"
            name="gm_phonenumber"
            placeholder="Phone Number"
            value={formData.gm_phonenumber}
            onChange={handleChange}
          />

          <div className="modal-actions">
            <button type="submit" disabled={!ikiId}>
              {editGudian ? 'Update' : 'Save'}
            </button>
            <button type="button" className="cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
