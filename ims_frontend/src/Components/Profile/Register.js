import React, { useState } from 'react';
import axios from 'axios';
import '../css/Form.css';

export default function Register() {
  const [form, setForm] = useState({
    fullNames: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    role: 'user'
  });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/register', form);
      alert('Registered successfully!');
    } catch (err) {
      alert('Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <label className="form-label">Full Names</label>
      <input name="fullNames" className="form-input" onChange={handleChange} required />

      <label className="form-label">Email</label>
      <input name="email" type="email" className="form-input" onChange={handleChange} required />

      <label className="form-label">Username</label>
      <input name="username" className="form-input" onChange={handleChange} required />

      <label className="form-label">Phone</label>
      <input name="phone" className="form-input" onChange={handleChange} required />

      <label className="form-label">Password</label>
      <input name="password" type="password" className="form-input" onChange={handleChange} required />

      <label className="form-label">Role</label>
      <select name="role" className="form-select" onChange={handleChange}>
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>

      <button type="submit" className="form-button">Register</button>
    </form>
  );
}
