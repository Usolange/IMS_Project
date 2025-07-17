import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../CSS/ModalForm.css';

export default function GudianMemberModal({ isOpen, onClose, onSuccess, editData }) {
  const [formData, setFormData] = useState({
    gm_names: '',
    gm_Nid: '',
    gm_phonenumber: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ikiId, setIkiId] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) setIkiId(user.id);
    else setError('No logged-in user found.');
  }, []);

  useEffect(() => {
    if (editData) {
      setFormData({
        gm_names: editData.gm_names,
        gm_Nid: editData.gm_Nid,
        gm_phonenumber: editData.gm_phonenumber,
      });
    } else {
      setFormData({ gm_names: '', gm_Nid: '', gm_phonenumber: '' });
    }
  }, [editData]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { gm_names, gm_Nid, gm_phonenumber } = formData;
    if (!gm_names || !gm_Nid || !gm_phonenumber) {
      setError('All fields are required.');
      return;
    }

    try {
      if (editData) {
        // Update existing
        await axios.put(`http://localhost:5000/api/gudianMembersRoutes/update/${editData.gm_id}`, formData);
        setSuccess('Member updated successfully.');
      } else {
        // Create new
        await axios.post('http://localhost:5000/api/gudianMembersRoutes/newGudianMember', {
          ...formData,
          iki_id: ikiId,
        });
        setSuccess('Member added successfully.');
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-form">
        <h2>{editData ? 'Update' : 'New'} Gudian Member</h2>

        {error && <div className="erroor">{error}</div>}
        {success && <div className="successs">{success}</div>}

        <form onSubmit={handleSubmit}>
          <input type="text" name="gm_names" placeholder="Full Name" value={formData.gm_names} onChange={handleChange} />
          <input type="text" name="gm_Nid" placeholder="National ID" value={formData.gm_Nid} onChange={handleChange} />
          <input type="text" name="gm_phonenumber" placeholder="Phone Number" value={formData.gm_phonenumber} onChange={handleChange} />

          <div className="modal-actions">
            <button type="submit">{editData ? 'Update' : 'Save'}</button>
            <button type="button" className="cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
