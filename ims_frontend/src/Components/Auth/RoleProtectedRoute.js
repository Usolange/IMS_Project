// Components/Auth/RoleProtectedRoute.js
import React, { useContext } from 'react';
import { Auth } from './Auth';
import { Navigate } from 'react-router-dom';

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(Auth);

  if (!user) {
    // Not logged in — redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Logged in but role not allowed — show unauthorized or redirect
    return <Navigate to="/unauthorized" replace />;
  }

  // Authorized
  return children;
};

export default RoleProtectedRoute;
