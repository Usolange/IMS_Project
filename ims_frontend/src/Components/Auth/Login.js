import React, { useState, useRef, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Auth } from './Auth';
import '../CSS/Form.css';

export default function Login({ switchToRegister, onCancel }) {
  const { login } = useContext(Auth);
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
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
    if (!formData.identifier.trim()) newErrors.identifier = '⚠️ Please enter your Email or Username';
    if (!formData.password.trim()) newErrors.password = '⚠️ Please enter your Password';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      if (newErrors.identifier) refs.identifier.current?.focus();
      else if (newErrors.password) refs.password.current?.focus();
      return;
    }

    setLoading(true);
    setErrors({});

    // Trim whitespace before sending
    const cleanedFormData = {
      identifier: formData.identifier.trim(),
      password: formData.password.trim(),
    };

    // Optional: blur inputs to avoid re-submission
    refs.identifier.current?.blur();
    refs.password.current?.blur();

    try {
      const res = await axios.post('http://localhost:5000/api/userLogin/login', cleanedFormData);

      login(res.data.token, res.data.user);

      const user = res.data.user;
      if (user.role === 'admin') navigate('/adminDashboard');
      else if (user.role === 'member') navigate('/dashboard');
      else if (user.role === 'ikimina') navigate('/ikiminaDashboard');
      else navigate('/dashboard');
    } catch (err) {
      // DEV: log full error to help you debug
      console.error('Login error:', err.response?.data || err.message);

      // Smarter error messaging based on status code
      let errorMessage = '❌ Login failed. Please try again.';
      if (err.response?.status === 401) {
        errorMessage = '❌ Invalid credentials. Please check and try again.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data.message || '❌ Bad request.';
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage = '❌ Cannot connect to server.';
      } else if (err.response?.status >= 500) {
        errorMessage = '❌ Server error. Try again later.';
      }

      setErrors({ server: errorMessage });
    } finally {
      setLoading(false);
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
          disabled={loading}
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
          disabled={loading}
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
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {onCancel && (
            <button
              type="button"
              className="cancel-button-login"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>

        <div className="form-switch-text-to">
          Don't have an account?{' '}
          <button
            type="button"
            className="form-link-to-login"
            onClick={switchToRegister}
            disabled={loading}
          >
            Register here
          </button>
        </div>
      </form>
    </div>
  );
}
