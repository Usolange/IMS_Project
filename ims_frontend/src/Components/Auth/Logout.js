import React, { useContext } from 'react';
import { Auth } from './Auth';
import { useNavigate } from 'react-router-dom';

export default function LogoutButton() {
  const { logout } = useContext(Auth);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return <button onClick={handleLogout}>Logout</button>;
}
