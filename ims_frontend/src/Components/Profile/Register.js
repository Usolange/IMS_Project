import React, { useState } from 'react';
import axios from 'axios';
import '../CSS/Form.css';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    password: ''
  });

  const [status, setStatus] = useState(null);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus(null); // Clear previous status

    try {
      // Send the request to the backend
      const res = await axios.post('http://localhost:5000/api/userLogin/register', form);
      setStatus({ success: true, message: res.data.message });
    } catch (err) {
      console.error('Registration Error:', err);
      // Check if error response is available and set status accordingly
      const errorMessage = err.response?.data?.message || 'Registration failed, please try again later.';
      setStatus({
        success: false,
        message: errorMessage
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2 className="form-title">Register Super Admin</h2>

      <label className="form-label">Full Name</label>
      <input name="name" className="form-input" onChange={handleChange} required />

      <label className="form-label">Email</label>
      <input name="email" type="email" className="form-input" onChange={handleChange} required />

      <label className="form-label">Username</label>
      <input name="username" className="form-input" onChange={handleChange} required />

      <label className="form-label">Phone</label>
      <input name="phone" className="form-input" onChange={handleChange} required />

      <label className="form-label">Password</label>
      <input name="password" type="password" className="form-input" onChange={handleChange} required />

      <button type="submit" className="form-button">Register</button>

      {status && (
        <div className={status.success ? "form-success" : "form-error"}>
          {status.message}
        </div>
      )}
    </form>
  );
}
