import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../CSS/ModalForm.css';

export default function RegisterMemberModal({ isOpen, onClose, onSuccess, editMember, iki_id }) {
  const [formData, setFormData] = useState({
    member_names: '',
    member_Nid: '',
    gm_Nid: '',
    member_phone_number: '',
    member_email: '',
    member_type_id: '',
  });

  const [gudianMembers, setGudianMembers] = useState([]);
  const [memberTypes, setMemberTypes] = useState([]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [generated, setGenerated] = useState(null);
  const [resendStatus, setResendStatus] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setFormData(editMember ? {
      member_names: editMember.member_names || '',
      member_Nid: editMember.member_Nid || '',
      gm_Nid: editMember.gm_Nid || '',
      member_phone_number: editMember.member_phone_number || '',
      member_email: editMember.member_email || '',
      member_type_id: editMember.member_type_id || '',
    } : {
      member_names: '',
      member_Nid: '',
      gm_Nid: '',
      member_phone_number: '',
      member_email: '',
      member_type_id: '',
    });

    const fetchData = async () => {
      try {
        const [gudiansRes, typesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/gudianMembersRoutes/select', { params: { iki_id } }),
          axios.get('http://localhost:5000/api/memberTypeRoutes/select'),
        ]);
        setGudianMembers(gudiansRes.data);
        setMemberTypes(typesRes.data);
      } catch (err) {
        console.error('Dropdown load error:', err);
      }
    };

    fetchData();
    setErrors({});
    setMessage('');
    setGenerated(null);
    setResendStatus('');
    setResendLoading(false);
    setIsSubmitting(false);
  }, [isOpen, editMember, iki_id]);

  const validate = () => {
    const errs = {};

    if (!formData.member_names.trim()) errs.member_names = 'Full Name is required.';

    if (!formData.member_Nid.trim() && !formData.gm_Nid) {
      errs.member_Nid = 'Either National ID or Guardian is required.';
      errs.gm_Nid = 'Either Guardian or National ID is required.';
    }

    if (!formData.member_phone_number.trim()) {
      errs.member_phone_number = 'Phone Number is required.';
    } else if (!/^\d{10}$/.test(formData.member_phone_number.trim())) {
      errs.member_phone_number = 'Phone Number must be exactly 10 digits.';
    }

    if (
      formData.member_email.trim() &&
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.member_email.trim())
    ) {
      errs.member_email = 'Invalid email format.';
    }

    if (!formData.member_type_id) errs.member_type_id = 'Please select a Member Type.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setMessage('');
    setResendStatus('');
  };

  const downloadCredentials = (code, pass) => {
    const blob = new Blob(
      [`Member Access Info:\nCode: ${code}\nPassword: ${pass}`],
      { type: 'text/plain;charset=utf-8' }
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `member_credentials_${code}.txt`;
    link.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setResendStatus('');
    setGenerated(null);

    if (!validate()) {
      setMessage('Please fix the errors below.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editMember) {
        await axios.put(
          `http://localhost:5000/api/membersInfoRoutes/${editMember.member_id}`,
          { ...formData, iki_id }
        );
        setMessage('✅ Member updated successfully.');
        if (onSuccess) onSuccess();
        setTimeout(onClose, 1500);
      } else {
        const res = await axios.post('http://localhost:5000/api/membersInfoRoutes/newMember', {
          gm_Nid: formData.gm_Nid,
          member_type_id: formData.member_type_id,
          iki_id,
          member_names: formData.member_names,
          member_Nid: formData.member_Nid,
          member_phone_number: formData.member_phone_number,
          member_email: formData.member_email,
        });

        setMessage(res.data.message || '✅ Member registered successfully.');
        setGenerated({
          member_code: res.data.member_code,
          member_pass: res.data.member_pass,
        });
        downloadCredentials(res.data.member_code, res.data.member_pass);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || '❌ Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendSMS = async () => {
    setResendStatus('');
    setResendLoading(true);
    try {
      await axios.post('http://localhost:5000/api/membersInfoRoutes/resend-sms', {
        phone: formData.member_phone_number,
      });
      setResendStatus('✅ SMS resent successfully.');
    } catch (err) {
      setResendStatus('❌ Failed to resend SMS.');
      console.error('Resend SMS error:', err);
    } finally {
      setResendLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!formData.member_email) {
      setResendStatus('❌ No email provided.');
      return;
    }
    setResendStatus('');
    setResendLoading(true);
    try {
      await axios.post('http://localhost:5000/api/membersInfoRoutes/resend-email', {
        email: formData.member_email,
        phone: formData.member_phone_number,
      });
      setResendStatus('✅ Email resent successfully.');
    } catch (err) {
      setResendStatus('❌ Failed to resend Email.');
      console.error('Resend Email error:', err);
    } finally {
      setResendLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-form">
        <h3>{editMember ? '✏️ Edit Member' : '➕ Register Member'}</h3>

        {message && <div className="form-msg">{message}</div>}

        {generated && (
          <div className="generated-box">
            <h4>🎉 Access Credentials</h4>
            <p><strong>Code:</strong> {generated.member_code}</p>
            <p><strong>Password:</strong> {generated.member_pass}</p>
            <p className="note">⚠️ Save or download these credentials for the member.</p>

            <div style={{ marginTop: '1rem' }}>
              <button type="button" onClick={handleResendSMS} disabled={resendLoading}>
                {resendLoading ? 'Sending SMS...' : 'Resend SMS'}
              </button>
              {formData.member_email && (
                <button type="button" onClick={handleResendEmail} disabled={resendLoading}>
                  {resendLoading ? 'Sending Email...' : 'Resend Email'}
                </button>
              )}
            </div>

            {resendStatus && <p style={{ marginTop: '0.5rem' }}>{resendStatus}</p>}
          </div>
        )}

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
            {gudianMembers.map(gm => (
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

          <select
            name="member_type_id"
            value={formData.member_type_id}
            onChange={handleChange}
          >
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
              {isSubmitting ? 'Submitting...' : editMember ? 'Update' : 'Register'}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
