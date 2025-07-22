import React, { useState } from 'react';
import axios from 'axios';
import '../CSS/ForgotPassword.css'; // contains fp- classes

export default function ForgotPassword({ onCancel }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/supperAdminRoutes/forgot-password', { email });
      setSuccess('✅ Check your email for reset instructions.');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send reset instructions.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="fp-wrapper">
      <label className="fp-label">Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="fp-input"
        placeholder="Enter your email"
        required
        onInvalid={(e) => {
          if (!e.target.value) {
            e.target.setCustomValidity('Email is required. Please enter your email.');
          } else {
            e.target.setCustomValidity('Please enter a valid email address.');
          }
        }}
        onInput={(e) => e.target.setCustomValidity('')}
      />

      {error && <div className="fp-error">{error}</div>}
      {success && <div className="fp-success">{success}</div>}

      <div className="fp-buttons">
        <button type="submit" className="fp-reset" disabled={loading}>
          {loading ? 'Sending...' : 'Reset'}
        </button>
        {onCancel && (
          <button type="button" className="fp-cancel" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
