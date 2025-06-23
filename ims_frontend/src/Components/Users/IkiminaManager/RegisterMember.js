import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function RegisterMember() {
  const [formData, setFormData] = useState({
    member_names: '',
    member_Nid: '',
    gm_Nid: '',
    member_phone_number: '',
    member_email: '',
    member_type_id: '',
    iki_id: '', // Ikimina id (can be user-selected or fixed)
  });

  const [gudianMembers, setGudianMembers] = useState([]);
  const [memberTypes, setMemberTypes] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch Gudian Members and Member Types for dropdowns
    const fetchDropdownData = async () => {
      try {
        const [gudiansRes, typesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/gudianMembersRoutes/select'),
          axios.get('http://localhost:5000/api/memberTypeRoutes/select'),
        ]);
        setGudianMembers(gudiansRes.data);
        setMemberTypes(typesRes.data);
      } catch (err) {
        console.error('Failed to load dropdown data', err);
      }
    };
    fetchDropdownData();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const {
      member_names,
      member_Nid,
      gm_Nid,
      member_phone_number,
      member_email,
      member_type_id,
      iki_id,
    } = formData;

    // Basic validation
    if (!member_names || !member_Nid || !gm_Nid || !member_phone_number || !member_email || !member_type_id || !iki_id) {
      setError('Please fill all the fields.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/membersInfoRoutes/members', formData);
      setSuccess(res.data.message || 'Member registered successfully!');
      setFormData({
        member_names: '',
        member_Nid: '',
        gm_Nid: '',
        member_phone_number: '',
        member_email: '',
        member_type_id: '',
        iki_id: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="form-container">
      <h2>Register New Member</h2>

      {error && <div className="erroor">{error}</div>}
      {success && <div className="successs">{success}</div>}

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

        <select
          name="gm_Nid"
          value={formData.gm_Nid}
          onChange={handleChange}
        >
          <option value="">Select Gudian Member</option>
          {gudianMembers.map(gm => (
            <option key={gm.gm_id} value={gm.gm_Nid}>{gm.gm_names} ({gm.gm_Nid})</option>
          ))}
        </select>

        <input
          type="text"
          name="member_phone_number"
          placeholder="Phone Number"
          value={formData.member_phone_number}
          onChange={handleChange}
        />

        <input
          type="email"
          name="member_email"
          placeholder="Email Address"
          value={formData.member_email}
          onChange={handleChange}
        />

        <select
          name="member_type_id"
          value={formData.member_type_id}
          onChange={handleChange}
        >
          <option value="">Select Member Type</option>
          {memberTypes.map(mt => (
            <option key={mt.member_type_id} value={mt.member_type_id}>{mt.member_type}</option>
          ))}
        </select>

        <input
          type="text"
          name="iki_id"
          placeholder="Ikimina ID"
          value={formData.iki_id}
          onChange={handleChange}
        />

        <button type="submit">Register Member</button>
      </form>
    </div>
  );
}
