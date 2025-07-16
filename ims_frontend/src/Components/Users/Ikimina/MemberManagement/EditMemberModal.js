import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../CSS/ModalForm.css';

export default function EditMemberModal({ isOpen, onClose, onSuccess, editMember, iki_id }) {
  const [formData, setFormData] = useState({
    member_names: '',
    member_Nid: '',
    gm_Nid: '',
    member_phone_number: '',
    member_email: '',
    member_type_id: '',
  });

  const [loading, setLoading] = useState(false);
  const [gudianMembers, setGudianMembers] = useState([]);
  const [memberTypes, setMemberTypes] = useState([]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ikiminaData, setIkiminaData] = useState({
    iki_id: '',
    iki_name: '',
    cell: '',
    village: '',
    sector: '',
  });

  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    setIkiminaData({
      iki_id: user.id || '',
      iki_name: user.name || '',
      cell: user.cell || '',
      village: user.village || '',
      sector: user.sector || '',
    });
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setMessage('');
      setErrors({});
      setIsSubmitting(false);

      try {
        const [gudianRes, typesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/gudianMembersRoutes/select', { params: { iki_id } }),
          axios.get('http://localhost:5000/api/memberTypeRoutes/select'),
        ]);
        if (cancelled) return;

        setGudianMembers(gudianRes.data || []);
        setMemberTypes(typesRes.data || []);

        if (editMember && editMember.member_id) {
          const res = await axios.get(`http://localhost:5000/api/membersInfoRoutes/select/${editMember.member_id}`);
          if (cancelled) return;

          if (res.data.success && res.data.data) {
            setFormData({
              member_names: res.data.data.member_names || '',
              member_Nid: res.data.data.member_Nid || '',
              gm_Nid: res.data.data.gm_Nid || '',
              member_phone_number: res.data.data.member_phone_number || '',
              member_email: res.data.data.member_email || '',
              member_type_id: res.data.data.member_type_id || '',
            });
          } else {
            setFormData({
              member_names: editMember.member_names || '',
              member_Nid: editMember.member_Nid || '',
              gm_Nid: editMember.gm_Nid || '',
              member_phone_number: editMember.member_phone_number || '',
              member_email: editMember.member_email || '',
              member_type_id: editMember.member_type_id || '',
            });
          }
        }
      } catch (e) {
        console.error('Fetching data failed:', e);
        if (cancelled) return;

        setGudianMembers([]);
        setMemberTypes([]);
        setFormData({
          member_names: '',
          member_Nid: '',
          gm_Nid: '',
          member_phone_number: '',
          member_email: '',
          member_type_id: '',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [isOpen, editMember, iki_id]);

  const validate = () => {
    const errs = {};
    if (!formData.member_names.trim()) errs.member_names = 'Full Name is required.';
    if (!formData.member_Nid.trim() && !formData.gm_Nid.trim())
      errs.member_Nid = errs.gm_Nid = 'Either National ID or Guardian NID is required.';
    if (!/^\d{10}$/.test(formData.member_phone_number.trim()))
      errs.member_phone_number = 'Phone Number must be exactly 10 digits.';
    if (
      formData.member_email.trim() &&
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.member_email.trim())
    )
      errs.member_email = 'Invalid email format.';
    if (!formData.member_type_id) errs.member_type_id = 'Please select a Member Type.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    if (!validate()) {
      setMessage('Please fix the errors below.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await axios.put(
        `http://localhost:5000/api/membersInfoRoutes/update/${editMember.member_id}`,
        formData,
        {
          headers: {
            'x-iki-id': user?.iki_id || user?.id,
          },
        }
      );

      const updated = res.data?.data;
      setMessage(res.data.message || '✅ Member updated successfully.');

      if (updated) {
        downloadMemberUpdateFile({
          member_names: updated.member_names,
          ikiminaName: updated.ikiminaName,
          location: updated.location,
          member_code: updated.member_code,
          member_pass: updated.member_pass,
          changes: updated.changes,
        });
      }

      onSuccess?.();
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error('Submission failed:', err);
      setMessage(err.response?.data?.message || '❌ Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-form">
        <h3>✏️ Edit Member</h3>

        {loading && <p>Loading...</p>}
        {message && <div className="form-msg">{message}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <input
            type="text"
            name="member_names"
            placeholder="Full Name"
            value={formData.member_names}
            onChange={handleChange}
          />
          {errors.member_names && <div className="error">{errors.member_names}</div>}

          <input
            type="text"
            name="member_Nid"
            placeholder="National ID"
            value={formData.member_Nid}
            onChange={handleChange}
            disabled={formData.gm_Nid.trim() !== ''}
          />
          <small>If National ID is empty, select Guardian.</small>
          {errors.member_Nid && <div className="error">{errors.member_Nid}</div>}

          <select
            name="gm_Nid"
            value={formData.gm_Nid}
            onChange={handleChange}
            disabled={formData.member_Nid.trim() !== ''}
          >
            <option value="">Select Guardian</option>
            {gudianMembers.map((gm) => (
              <option key={gm.gm_id} value={gm.gm_Nid}>
                {gm.gm_names} ({gm.gm_Nid})
              </option>
            ))}
          </select>
          {errors.gm_Nid && <div className="error">{errors.gm_Nid}</div>}

          <input
            type="text"
            name="member_phone_number"
            placeholder="Phone Number"
            value={formData.member_phone_number}
            onChange={handleChange}
          />
          {errors.member_phone_number && <div className="error">{errors.member_phone_number}</div>}

          <input
            type="email"
            name="member_email"
            placeholder="Email (optional)"
            value={formData.member_email}
            onChange={handleChange}
          />
          {errors.member_email && <div className="error">{errors.member_email}</div>}

          <select name="member_type_id" value={formData.member_type_id} onChange={handleChange}>
            <option value="">Select Member Type</option>
            {memberTypes.map((type) => (
              <option key={type.member_type_id} value={type.member_type_id}>
                {type.member_type}
              </option>
            ))}
          </select>
          {errors.member_type_id && <div className="error">{errors.member_type_id}</div>}

          <div className="modal-btns">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ✅ Download TXT helper function
function downloadMemberUpdateFile({ member_names, ikiminaName, location, member_code, member_pass, changes }) {
  const content = `
Member: ${member_names}
Ikimina: ${ikiminaName}
Location: ${location}

Access Code: ${member_code}
Password: ${member_pass}

Changes:
${changes.length ? changes.join('\n') : 'No field changes detected.'}
  `.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${member_names.replace(/\s+/g, '_')}_update.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
