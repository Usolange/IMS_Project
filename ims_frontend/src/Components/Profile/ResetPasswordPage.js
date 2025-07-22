import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../CSS/ResetPassword.css';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validToken, setValidToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No token provided.');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`http://localhost:5000/api/supperAdminRoutes/reset-password/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
          setValidToken(false);
        } else {
          setValidToken(true);
          setError('');
        }
      })
      .catch(() => setError('Server error validating token.'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Both password fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/supperAdminRoutes/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Password reset successful. Redirecting to login...');
        setError('');
        setTimeout(() => {
          navigate('/login'); // redirect to login after success
        }, 2500);
      } else {
        setError(data.error || 'Password reset failed.');
        setMessage('');
      }
    } catch {
      setError('Network error. Try again later.');
      setMessage('');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <p className="rp-loading-text">Validating token...</p>;
  }

  if (!validToken) {
    return (
      <div className="rp-error-container">
        <p className="rp-error">{error || 'Invalid or expired token.'}</p>
        <button className="rp-cancel-button" onClick={() => navigate('/login')}>
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="rp-page-wrapper">
      <form onSubmit={handleSubmit} className="rp-form" noValidate>
        <h2 className="rp-form-title">Set New Password</h2>

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="rp-input"
          autoFocus
          disabled={submitting}
          aria-required="true"
          minLength={6}
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="rp-input"
          disabled={submitting}
          aria-required="true"
          minLength={6}
        />

        <div className="rp-buttons-container">
          <button type="submit" className="rp-reset-button" disabled={submitting}>
            {submitting ? 'Resetting...' : 'Reset Password'}
          </button>
          <button
            type="button"
            className="rp-cancel-button"
            onClick={() => navigate('/login')}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>

        {message && <p className="rp-success">{message}</p>}
        {error && <p className="rp-error">{error}</p>}
      </form>
    </div>
  );
}
