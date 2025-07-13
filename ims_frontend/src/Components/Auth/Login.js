import React, { useState, useRef, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Auth } from './Auth';
import { Eye, EyeOff } from 'lucide-react';
import '../CSS/Login.css';  // keep your css file

export default function Login({ switchToRegister, onCancel }) {
  const { login } = useContext(Auth);
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

    const cleanedFormData = {
  identifier: formData.identifier.trim(),
  password: formData.password.trim(),
};

console.log('Sending to backend:', cleanedFormData); // <-- ADD THIS

refs.identifier.current?.blur();
refs.password.current?.blur();

try {
  const res = await axios.post('http://localhost:5000/api/userLoginRoutes/login', cleanedFormData);

      login(res.data.token, res.data.user);

      const user = res.data.user;
      if (user.role === 'admin') navigate('/adminDashboard');
      else if (user.role === 'member') navigate('/memberDashboard');
      else if (user.role === 'ikimina') navigate('/ikiminaDashboard');
      else navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);

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
    <div className="form-container dark:bg-gray-900 dark:text-white max-w-md mx-auto p-6 rounded-md shadow-md">
      <h2 className="form-title text-center text-2xl font-semibold mb-4">Login</h2>

      <form onSubmit={handleLogin} noValidate>
        <input
          name="identifier"
          ref={refs.identifier}
          type="text"
          placeholder="Email / Username / Phone"
          value={formData.identifier}
          onChange={handleChange}
          aria-describedby="error-identifier"
          aria-invalid={!!errors.identifier}
          autoComplete="username"
          disabled={loading}
          className={`form-input ${errors.identifier ? 'input-error' : ''}`}
        />
        {errors.identifier && (
          <div id="error-identifier" className="error" aria-live="polite">
            {errors.identifier}
          </div>
        )}

        <div className="relative">
          <input
            name="password"
            ref={refs.password}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            aria-describedby="error-password"
            aria-invalid={!!errors.password}
            autoComplete="current-password"
            disabled={loading}
            className={`form-input pr-10 ${errors.password ? 'input-error' : ''}`}
          />
          <span
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-2.5 cursor-pointer text-gray-500"
            aria-label="Toggle password visibility"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setShowPassword((prev) => !prev);
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
        </div>
        {errors.password && (
          <div id="error-password" className="error" aria-live="polite">
            {errors.password}
          </div>
        )}

        {errors.server && (
          <div className="error server-error" aria-live="polite">
            {errors.server}
          </div>
        )}

        <div className="login-buttons-container flex justify-center space-x-4 mt-4">
          <button
            type="submit"
            className="login-button bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded px-4 py-2 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 h-10 min-w-[90px]"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {onCancel && (
            <button
              type="button"
              className="cancel-button-login bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded px-4 py-2 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-400 h-10 min-w-[90px]"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>


        <div className="form-switch-text-to text-center mt-5 text-sm">
          Don&apos;t have an account?{' '}
          <span
            className="form-link-to-login text-blue-600 hover:underline cursor-pointer"
            onClick={switchToRegister}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') switchToRegister();
            }}
            aria-disabled={loading}
            style={{ pointerEvents: loading ? 'none' : 'auto' }}
          >
            Register here
          </span>
        </div>
      </form>
    </div>
  );
}
