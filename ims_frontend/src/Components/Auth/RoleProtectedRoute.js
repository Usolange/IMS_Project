import { Navigate } from 'react-router-dom';

export default function RoleProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token || role !== requiredRole) {
    return <Navigate to="/login" />;
  }

  return children;
}
