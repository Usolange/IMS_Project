import { Navigate } from 'react-router-dom';

const RoleProtectedRoute = ({ children, requiredRole }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user || user.role !== requiredRole) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default RoleProtectedRoute;
