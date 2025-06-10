import React from 'react';
import { Navigate } from 'react-router-dom';

const RoleProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />; // or redirect to unauthorized page
  }

  return children;
};

export default RoleProtectedRoute;
