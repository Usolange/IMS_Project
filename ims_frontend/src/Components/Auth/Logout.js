import React, { useContext } from 'react';
import { Auth } from './Auth';
import { useNavigate, Link } from 'react-router-dom';

export default function LogoutButton() {
  const { logout } = useContext(Auth);
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault(); // prevent default link behavior
    logout();           // clear auth
    navigate('/');      // redirect after logout
  };

  return (
    <Link to="/" onClick={handleLogout} className="dropdown-link" role="menuitem">
      Logout
    </Link>
  );
}
