import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


import '../CSS/Login.css';
export default function Login({ switchToRegister, onCancel }) {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const refs = {
    identifier: useRef(null),
    password: useRef(null),
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.identifier.trim()) newErrors.identifier = '⚠️ Please! Please enter your Email or Username';
    if (!formData.password.trim()) newErrors.password = '⚠️ Please! Please enter your Password';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      if (newErrors.identifier) refs.identifier.current?.focus();
      else if (newErrors.password) refs.password.current?.focus();
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/userLogin/login', formData);

      // Store token and user info
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      const user = res.data.user;

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/adminDashboard');
      } else if (user.role === 'member') {
        navigate('/dashboard');
      } else if (user.role === 'ikimina') {
        navigate('/ikiminaashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || '❌ Login failed. Please check your credentials.';
      setErrors({ server: errorMessage });
    }
  };



  return (
    <div>
      <h2 className="form-title">Login</h2>
      <form onSubmit={handleLogin} className="form-container" noValidate>
        <input
          name="identifier"
          ref={refs.identifier}
          type="text"
          placeholder="Email / Username / Phone"
          value={formData.identifier}
          onChange={handleChange}
          className="form-input"
          aria-describedby="error-identifier"
          aria-invalid={!!errors.identifier}
          autoComplete="username"
        />
        {errors.identifier && (
          <div id="error-identifier" className="error" aria-live="polite">
            {errors.identifier}
          </div>
        )}

        <input
          name="password"
          ref={refs.password}
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="form-input"
          aria-describedby="error-password"
          aria-invalid={!!errors.password}
          autoComplete="current-password"
        />
        {errors.password && (
          <div id="error-password" className="error" aria-live="polite">
            {errors.password}
          </div>
        )}

        {errors.server && (
          <div className="error" aria-live="polite">
            {errors.server}
          </div>
        )}

        <div className="login-buttons-container">
          <button type="submit" className="login-button">Login</button>
          {onCancel && (
            <button type="button" className="cancel-button-login" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>

        <div className="form-switch-text-register">
          Don't have an account?{' '}
          <button type="button" className="form-link-register" onClick={switchToRegister}>
            Register here
          </button>
        </div>
      </form>
    </div>
  );
}
