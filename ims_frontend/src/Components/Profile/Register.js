import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../CSS/Register.css'

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

    if (!form.name) {
      tempErrors.name = "Full Name is required.";
      isValid = false;
    } else {
      tempErrors.name = '';
    }

    if (!form.email) {
      tempErrors.email = "Email is required.";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      tempErrors.email = "Email is invalid.";
      isValid = false;
    } else {
      tempErrors.email = '';
    }

    if (!form.username) {
      tempErrors.username = "Username is required.";
      isValid = false;
    } else {
      tempErrors.username = '';
    }

    if (!form.phone) {
      tempErrors.phone = "Phone number is required.";
      isValid = false;
    } else if (!/^\d{10}$/.test(form.phone)) {
      tempErrors.phone = "Phone number should be 10 digits.";
      isValid = false;
    } else {
      tempErrors.phone = '';
    }

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
    setStatus(null);

    if (!validateForm()) {
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/userLogin/register', form);
      setStatus({ success: true, message: res.data.message });

      setForm({
        name: '',
        email: '',
        username: '',
        phone: '',
        password: ''
      });

      setTimeout(() => {
        if (switchToLogin) switchToLogin();
        else navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Registration Error:', err);
      const errorMessage = err.response?.data?.message || 'Registration failed, please try again later.';
      setStatus({ success: false, message: errorMessage });
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

      <input
        name="name"
        value={form.name}
        placeholder="Full Name"
        className={`form-input ${errors.name ? 'error' : ''}`}
        onChange={handleChange}
        onFocus={handleFocus}
      />
      {errors.name && <div className="form-error">{errors.name}</div>}

      <input
        name="email"
        type="email"
        value={form.email}
        placeholder="Email"
        className={`form-input ${errors.email ? 'error' : ''}`}
        onChange={handleChange}
        onFocus={handleFocus}
      />
      {errors.email && <div className="form-error">{errors.email}</div>}

      <input
        name="username"
        value={form.username}
        placeholder="Username"
        className={`form-input ${errors.username ? 'error' : ''}`}
        onChange={handleChange}
        onFocus={handleFocus}
      />
      {errors.username && <div className="form-error">{errors.username}</div>}

      <input
        name="phone"
        type="tel"
        value={form.phone}
        placeholder="Phone"
        className={`form-input ${errors.phone ? 'error' : ''}`}
        onChange={handleChange}
        onFocus={handleFocus}
      />
      {errors.phone && <div className="form-error">{errors.phone}</div>}

      <input
        name="password"
        type="password"
        value={form.password}
        placeholder="Password"
        className={`form-input ${errors.password ? 'error' : ''}`}
        onChange={handleChange}
        onFocus={handleFocus}
      />
      {errors.password && <div className="form-error">{errors.password}</div>}

      <div className="form-button-group">
        <button type="submit" className="form-button-register">Register</button>
        <button type="button" className="form-button-cancel" onClick={onCancel}>Cancel</button>
      </div>

      {status && (
        <div className={status.success ? "form-success" : "form-error"}>
          {status.message}
        </div>
      )}

      <div className="form-switch-text-register">
        Already have an account?{' '}
        <span className="form-link-register" onClick={switchToLogin}>
          Click to login
        </span>
      </div>
    </form>
  );
}
