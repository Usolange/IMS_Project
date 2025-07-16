import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../CSS/ModalForm.css';

export default function RegisterMemberModal({ isOpen, onClose, onSuccess, iki_id }) {
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
  const [generated, setGenerated] = useState(null);
  const [resendStatus, setResendStatus] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ikiminaData, setIkiminaData] = useState({
    iki_id: '',
    iki_name: '',
    cell: '',
    village: '',
    sector: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setMessage('');
      setErrors({});
      setGenerated(null);
      setResendStatus('');
      setResendLoading(false);
      setIsSubmitting(false);

      const user = JSON.parse(localStorage.getItem('user')) || {};

      setIkiminaData({
        iki_id: user.id || user.iki_id || '',
        iki_name: user.name || '',
        cell: user.cell || '',
        village: user.village || '',
        sector: user.sector || '',
      });


      try {
        const [gudianRes, typesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/gudianMembersRoutes/select', { params: { iki_id } }),
          axios.get('http://localhost:5000/api/memberTypeRoutes/select'),
        ]);
        if (cancelled) return;

        setGudianMembers(gudianRes.data || []);
        setMemberTypes(typesRes.data || []);

        setFormData({
          member_names: '',
          member_Nid: '',
          gm_Nid: '',
          member_phone_number: '',
          member_email: '',
          member_type_id: '',
        });
      } catch (e) {
        console.error('Fetching data failed:', e);
        if (cancelled) return;

        setGudianMembers([]);
        setMemberTypes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [isOpen, iki_id]);

  const validate = () => {
    const errs = {};
    if (!formData.member_names.trim()) errs.member_names = 'Full Name is required.';
    if (!formData.member_Nid.trim() && !formData.gm_Nid.trim())
      errs.member_Nid = errs.gm_Nid = 'Either National ID or Guardian is required.';
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
    setResendStatus('');
  };

  const downloadCredentials = (code, pass) => {
    const blob = new Blob([`Member Access Info:\nCode: ${code}\nPassword: ${pass}`], {
      type: 'text/plain;charset=utf-8',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `member_credentials_${code}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
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

  const payload = {
    ...formData,
  };

  const headers = {
    'x-iki-id': ikiminaData.iki_id,
    'x-iki-name': ikiminaData.iki_name,
    'x-cell': ikiminaData.cell,
    'x-village': ikiminaData.village,
    'x-sector': ikiminaData.sector,
  };

  console.log("Submitting payload:", payload);
  console.log("Headers:", headers);

  try {
    const res = await axios.post(
      'http://localhost:5000/api/membersInfoRoutes/newMember',
      payload,
      { headers }
    );

    setMessage(res.data.message || '✅ Member registered successfully.');
    setGenerated({
      member_code: res.data.data?.member_code,
      member_pass: res.data.data?.member_pass,
    });
    downloadCredentials(res.data.data?.member_code, res.data.data?.member_pass);
    onSuccess?.();
  } catch (err) {
    console.error('Submission failed:', err);
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
        iki_id,
      });
      setResendStatus('✅ SMS resent successfully.');
    } catch (err) {
      console.error('Resend SMS failed:', err);
      setResendStatus('❌ Failed to resend SMS.');
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
        iki_id,
        iki_name: ikiminaData.iki_name,
      });
      setResendStatus('✅ Email resent successfully.');
    } catch (err) {
      console.error('Resend email failed:', err);
      setResendStatus('❌ Failed to resend Email.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-form">
        <h3>➕ Register Member</h3>

        <div className="location-info" style={{ marginBottom: '1rem' }}>
          <p><strong>Ikimina Name:</strong> {ikiminaData.iki_name || 'Not set'}</p>
          <p><strong>Cell:</strong> {ikiminaData.cell || 'Not set'}</p>
          <p><strong>Village:</strong> {ikiminaData.village || 'Not set'}</p>
          <p><strong>Sector:</strong> {ikiminaData.sector || 'Not set'}</p>
        </div>

        {loading && <p>Loading...</p>}
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
              <button
                type="button"
                onClick={() => downloadCredentials(generated.member_code, generated.member_pass)}
                style={{ marginLeft: '8px' }}
              >
                Download Credentials
              </button>
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
              {isSubmitting ? 'Submitting...' : 'Register'}
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
