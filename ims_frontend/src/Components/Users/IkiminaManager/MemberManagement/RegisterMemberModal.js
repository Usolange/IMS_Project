import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../CSS/ModalForm.css';

export default function RegisterMemberModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    member_names: '',
    member_Nid: '',
    gm_Nid: '',
    member_phone_number: '',
    member_email: '',
    member_type_id: '',
    iki_id: ''
  });

  const [gudianMembers, setGudianMembers] = useState([]);
  const [memberTypes, setMemberTypes] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [gudians, types] = await Promise.all([
          axios.get('http://localhost:5000/api/gudian-members'),
          axios.get('http://localhost:5000/api/member-types')
        ]);
        setGudianMembers(gudians.data);
        setMemberTypes(types.data);
      } catch (err) {
        console.error('Dropdown load error:', err);
      }
    };

    fetchData();
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const {
      member_names, member_Nid, gm_Nid,
      member_phone_number, member_email,
      member_type_id, iki_id
    } = formData;

    if (!member_names || !member_Nid || !gm_Nid || !member_phone_number || !member_email || !member_type_id || !iki_id) {
      setMessage('Please fill all fields.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/members', formData);
      setMessage(res.data.message || 'Member registered.');
      if (onSuccess) onSuccess();
      onClose();
      setFormData({
        member_names: '',
        member_Nid: '',
        gm_Nid: '',
        member_phone_number: '',
        member_email: '',
        member_type_id: '',
        iki_id: ''
      });
    } catch (err) {
      console.error(err);
      setMessage('Registration failed.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-form">
        <h3>➕ Register Member</h3>

        {message && <div className="form-msg">{message}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="member_names"
            placeholder="Full Name"
            value={formData.member_names}
            onChange={handleChange}
          />
          <input
            type="text"
            name="member_Nid"
            placeholder="National ID"
            value={formData.member_Nid}
            onChange={handleChange}
          />
          <select name="gm_Nid" value={formData.gm_Nid} onChange={handleChange}>
            <option value="">Select Gudian</option>
            {gudianMembers.map(gm => (
              <option key={gm.gm_id} value={gm.gm_Nid}>
                {gm.gm_names} ({gm.gm_Nid})
              </option>
            ))}
          </select>
          <input
            type="text"
            name="member_phone_number"
            placeholder="Phone"
            value={formData.member_phone_number}
            onChange={handleChange}
          />
          <input
            type="email"
            name="member_email"
            placeholder="Email"
            value={formData.member_email}
            onChange={handleChange}
          />
          <select name="member_type_id" value={formData.member_type_id} onChange={handleChange}>
            <option value="">Select Member Type</option>
            {memberTypes.map(type => (
              <option key={type.member_type_id} value={type.member_type_id}>
                {type.member_type}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="iki_id"
            placeholder="Ikimina ID"
            value={formData.iki_id}
            onChange={handleChange}
          />

          <div className="modal-actions">
            <button type="submit">Register</button>
            <button type="button" className="cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
