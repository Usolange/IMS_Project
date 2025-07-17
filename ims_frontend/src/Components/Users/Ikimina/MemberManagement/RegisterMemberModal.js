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
    const user = JSON.parse(localStorage.getItem('user')) || {};
    console.log('Loaded user:', user);

    if (user) {
      setIkiminaData({
        iki_id: user.id || '',
        iki_name: user.name || '',
        cell: user.cell || '',
        village: user.village || '',
        sector: user.sector || '',
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      member_names: '',
      member_Nid: '',
      gm_Nid: '',
      member_phone_number: '',
      member_email: '',
      member_type_id: '',
    });

    const fetchDropdowns = async () => {
      try {
        const [gudiansRes, typesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/gudianMembersRoutes/select', { params: { iki_id } }),
          axios.get('http://localhost:5000/api/memberTypeRoutes/select'),
        ]);
        setGudianMembers(gudiansRes.data);
        setMemberTypes(typesRes.data);
      } catch (err) {
        console.error('Dropdown fetch failed:', err);
      }
    };

    fetchDropdowns();

    setErrors({});
    setMessage('');
    setGenerated(null);
    setResendStatus('');
    setResendLoading(false);
    setIsSubmitting(false);
  }, [isOpen, iki_id]);

  const validate = () => {
    const errs = {};

    // Full name required
    if (!formData.member_names.trim()) {
      errs.member_names = 'Full Name is required.';
    }

    // National ID or Guardian required, validate National ID length if provided
    if (!formData.member_Nid.trim() && !formData.gm_Nid) {
      errs.member_Nid = 'Either National ID or Guardian is required.';
      errs.gm_Nid = 'Either National ID or Guardian is required.';
    } else if (formData.member_Nid.trim()) {
      // Validate National ID length and numeric only
      if (!/^\d{16}$/.test(formData.member_Nid.trim())) {
        errs.member_Nid = 'National ID must be exactly 16 digits.';
      }
    }

    // Phone number exactly 10 digits
    if (!/^\d{10}$/.test(formData.member_phone_number.trim())) {
      errs.member_phone_number = 'Phone Number must be exactly 10 digits.';
    }

    // Email format validation (optional)
    if (
      formData.member_email.trim() &&
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.member_email.trim())
    ) {
      errs.member_email = 'Invalid email format.';
    }

    // Member type required
    if (!formData.member_type_id) {
      errs.member_type_id = 'Please select a Member Type.';
    }

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

    if (
      !ikiminaData.iki_id ||
      !ikiminaData.iki_name ||
      !ikiminaData.cell ||
      !ikiminaData.village ||
      !ikiminaData.sector
    ) {
      setMessage('Missing Ikimina data.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      member_names: formData.member_names,
      member_Nid: formData.member_Nid,
      gm_Nid: formData.gm_Nid,
      member_phone_number: formData.member_phone_number,
      member_email: formData.member_email,
      member_type_id: formData.member_type_id,
    };

    const headers = {
      'x-iki-id': ikiminaData.iki_id,
      'x-iki-name': ikiminaData.iki_name,
      'x-cell': ikiminaData.cell,
      'x-village': ikiminaData.village,
      'x-sector': ikiminaData.sector,
    };

    console.log('Submitting payload:', payload);
    console.log('Submitting headers:', headers);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/membersInfoRoutes/newMember',
        payload,
        { headers }
      );

      setMessage(response.data.message || '✅ Member registered successfully.');
      setGenerated({
        member_code: response.data.data?.member_code,
        member_pass: response.data.data?.member_pass,
      });

      downloadCredentials(response.data.data?.member_code, response.data.data?.member_pass);

      // Trigger parent data refresh
      onSuccess?.();

      // Close modal after a short delay
      setTimeout(() => {
        onClose?.();
      }, 1200); // Optional delay to show success message or credentials


      downloadCredentials(response.data.data?.member_code, response.data.data?.member_pass);
      onSuccess?.();
    } catch (err) {
      // Log detailed error info
      console.error('Member registration failed:', err);

      // Extract backend error message if available
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        '❌ Operation failed.';

      // Optionally, handle specific status codes
      if (err.response?.status === 409) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          member_phone_number: 'Phone number or National ID already registered.',
        }));
      } else if (err.response?.status === 400) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          member_type_id: 'Invalid member type selected.',
        }));
      }

      setMessage(serverMessage);
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
          <p>
            <strong>ID:</strong> {ikiminaData.iki_id || 'Not set'}
          </p>
          <p>
            <strong>Ikimina Name:</strong> {ikiminaData.iki_name || 'Not set'}
          </p>
          <p>
            <strong>Cell:</strong> {ikiminaData.cell || 'Not set'}
          </p>
          <p>
            <strong>Village:</strong> {ikiminaData.village || 'Not set'}
          </p>
          <p>
            <strong>Sector:</strong> {ikiminaData.sector || 'Not set'}
          </p>
        </div>

        {message && <div className="form-msg">{message}</div>}

        {generated && (
          <div className="generated-box">
            <h4>🎉 Access Credentials</h4>
            <p>
              <strong>Code:</strong> {generated.member_code}
            </p>
            <p>
              <strong>Password:</strong> {generated.member_pass}
            </p>
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
