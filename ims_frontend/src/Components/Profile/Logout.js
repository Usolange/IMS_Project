// src/Components/Profile/Logout.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear token and user info
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login
    navigate('/');
  }, [navigate]);

  return null;
};

export default Logout;
