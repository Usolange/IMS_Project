import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../CSS/Register.css';  // Make sure this CSS file has the styles I gave you

export default function Register({ switchToLogin, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    location: '',
    password: ''
  });

  const [status, setStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFocus = () => setStatus(null);

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!form.name) {
      newErrors.name = 'Full name is required.';
      isValid = false;
    }
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Valid email is required.';
      isValid = false;
    }
    if (!form.username) {
      newErrors.username = 'Username is required.';
      isValid = false;
    }
    if (!form.phone || !/^\d{10}$/.test(form.phone)) {
      newErrors.phone = 'Phone number must be 10 digits.';
      isValid = false;
    }
    if (!form.location) {
      newErrors.location = 'Location is required.';
      isValid = false;
    }
    if (!form.password || form.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (!validateForm()) return;

    try {
      const res = await axios.post('http://localhost:5000/api/supperAdminRoutes/newSupperUser', {
        name: form.name,
        email: form.email,
        username: form.username,
        phone: form.phone,
        location: form.location,
        password: form.password
      });

      setStatus({ success: true, message: res.data.message });

      setForm({
        name: '',
        email: '',
        username: '',
        phone: '',
        location: '',
        password: ''
      });

      setTimeout(() => {
        if (switchToLogin) {
          switchToLogin();
        } else {
          navigate('/');
        }
      }, 2000);

    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed. Try again.';
      setStatus({ success: false, message: errorMsg });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <h2 className="form-title">Register Super Admin</h2>

      <input
        type="text"
        name="name"
        placeholder="Full Name"
        value={form.name}
        onChange={handleChange}
        onFocus={handleFocus}
        className={`form-input ${errors.name ? 'error' : ''}`}
      />
      {errors.name && <div className="form-error">{errors.name}</div>}

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        onFocus={handleFocus}
        className={`form-input ${errors.email ? 'error' : ''}`}
      />
      {errors.email && <div className="form-error">{errors.email}</div>}

      <input
        type="text"
        name="username"
        placeholder="Username"
        value={form.username}
        onChange={handleChange}
        onFocus={handleFocus}
        className={`form-input ${errors.username ? 'error' : ''}`}
      />
      {errors.username && <div className="form-error">{errors.username}</div>}

      <input
        type="tel"
        name="phone"
        placeholder="Phone (10 digits)"
        value={form.phone}
        onChange={handleChange}
        onFocus={handleFocus}
        className={`form-input ${errors.phone ? 'error' : ''}`}
      />
      {errors.phone && <div className="form-error">{errors.phone}</div>}

      <input
        type="text"
        name="location"
        placeholder="Location"
        value={form.location}
        onChange={handleChange}
        onFocus={handleFocus}
        className={`form-input ${errors.location ? 'error' : ''}`}
      />
      {errors.location && <div className="form-error">{errors.location}</div>}

      <input
        type="password"
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        onFocus={handleFocus}
        className={`form-input ${errors.password ? 'error' : ''}`}
      />
      {errors.password && <div className="form-error">{errors.password}</div>}

      <div className="form-button-group">
        <button type="submit" className="form-button-register">Register</button>
        <button type="button" className="form-button-cancel" onClick={onCancel}>Cancel</button>
      </div>

      {status && (
        <div className={status.success ? 'form-success' : 'form-error'}>
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
