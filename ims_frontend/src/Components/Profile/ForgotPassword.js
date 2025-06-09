import React, { useState } from 'react';
import axios from 'axios';
import '../CSS/Form.css';

export default function ForgotPassword() {
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
      />
      <button type="submit" className="form-button">Reset Password</button>
    </form>
  );
}
