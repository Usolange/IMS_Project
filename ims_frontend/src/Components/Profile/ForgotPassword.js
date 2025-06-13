import React, { useState } from 'react';
import axios from 'axios';
import '../CSS/ForgotPassword.css'

export default function ForgotPassword({ onCancel, loading }) {
  const [email, setEmail] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/forgot-password', { email });
      alert('Check your email for reset instructions');
    } catch (err) {
      alert('Error sending reset email');
    }
  };

   return (
    <form onSubmit={handleSubmit} className="form-container">
      <label className="form-label">Email</label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="form-input"
        placeholder="Enter your email"
        required
        onInvalid={e => {
          if (!e.target.value) {
            e.target.setCustomValidity('Email is required. Please enter your email.');
          } else {
            e.target.setCustomValidity('Please enter a valid email address.');
          }
        }}
        onInput={e => e.target.setCustomValidity('')}
      />

      <div className="buttons-container">
        <button type="submit" className="reset-button" disabled={loading}>
          {loading ? 'Sending...' : 'Reset'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="cancel-button"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}