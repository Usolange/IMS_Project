import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../CSS/Form.css';

export default function Register({ switchToLogin, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    password: ''
  });

  const [status, setStatus] = useState(null);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    password: ''
  });

  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFocus = () => {
    setStatus(null);  // Clear message when input field is focused
  };

  const validateForm = () => {
    let tempErrors = { ...errors };
    let isValid = true;

    // Validate name
    if (!form.name) {
      tempErrors.name = "Full Name is required.";
      isValid = false;
    } else {
      tempErrors.name = '';
    }

    // Validate email
    if (!form.email) {
      tempErrors.email = "Email is required.";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      tempErrors.email = "Email is invalid.";
      isValid = false;
    } else {
      tempErrors.email = '';
    }

    // Validate username
    if (!form.username) {
      tempErrors.username = "Username is required.";
      isValid = false;
    } else {
      tempErrors.username = '';
    }

    // Validate phone number (basic validation for format)
    if (!form.phone) {
      tempErrors.phone = "Phone number is required.";
      isValid = false;
    } else if (!/^\d{10}$/.test(form.phone)) {
      tempErrors.phone = "Phone number should be 10 digits.";
      isValid = false;
    } else {
      tempErrors.phone = '';
    }

    // Validate password
    if (!form.password) {
      tempErrors.password = "Password is required.";
      isValid = false;
    } else {
      tempErrors.password = '';
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus(null);  // Clear previous status

    if (!validateForm()) {
      return;
    }

    try {
      // Send the request to the backend
      const res = await axios.post('http://localhost:5000/api/userLogin/register', form);
      setStatus({ success: true, message: res.data.message });

      // Reset the form after successful submission
      setForm({
        name: '',
        email: '',
        username: '',
        phone: '',
        password: ''
      });

      // Redirect to login page after successful registration
      setTimeout(() => {
        if (switchToLogin) switchToLogin();  // Switch to login form
        else navigate('/');  // Fallback if switchToLogin is not passed
      }, 2000);
    } catch (err) {
      console.error('Registration Error:', err);
      const errorMessage = err.response?.data?.message || 'Registration failed, please try again later.';
      setStatus({
        success: false,
        message: errorMessage
      });

      // Clear the form upon error to allow a fresh attempt
      setForm({
        name: '',
        email: '',
        username: '',
        phone: '',
        password: ''
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2 className="form-title">Register Super Admin</h2>

      <label className="form-label">Full Name</label>
      <input
        name="name"
        value={form.name}
        className={`form-input ${errors.name ? 'error' : ''}`}
        onChange={handleChange}
        onFocus={handleFocus}
      />
      {errors.name && <div className="form-error">{errors.name}</div>}

      <label className="form-label">Email</label>
      <input
        name="email"
        type="email"
        value={form.email}
        className={`form-input ${errors.email ? 'error' : ''}`}
        onChange={handleChange}
        onFocus={handleFocus}
      />
      {errors.email && <div className="form-error">{errors.email}</div>}

      <label className="form-label">Username</label>
      <input
        name="username"
        value={form.username}
        className={`form-input ${errors.username ? 'error' : ''}`}
        onChange={handleChange}
        onFocus={handleFocus}
      />
      {errors.username && <div className="form-error">{errors.username}</div>}

      <label className="form-label">Phone</label>
      <input
        name="phone"
        value={form.phone}
        className={`form-input ${errors.phone ? 'error' : ''}`}
        onChange={handleChange}
        onFocus={handleFocus}
        type="tel"
      />
      {errors.phone && <div className="form-error">{errors.phone}</div>}

      <label className="form-label">Password</label>
      <input
        name="password"
        type="password"
        value={form.password}
        className={`form-input ${errors.password ? 'error' : ''}`}
        onChange={handleChange}
        onFocus={handleFocus}
      />
      {errors.password && <div className="form-error">{errors.password}</div>}

      <button type="submit" className="form-button-register">Register</button>

      {/* Cancel button */}
      <button type="button" className="form-button-cancel" onClick={onCancel}>Cancel</button>

      {status && (
        <div className={status.success ? "form-success" : "form-error"}>
          {status.message}
        </div>
      )}

      {/* Switch to login text */}
      <div className="form-switch-text-register">
        Already have an account?{' '}
        <button
          type="button"
          className="form-link-register"
          onClick={switchToLogin}
        >
          Click to login
        </button>
      </div>
    </form>
  );
}
