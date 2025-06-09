import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Components/Layout';
import Dashboard from './Components/Dashboard';
import Report from './Components/Report';
import Members from './Components/Member/Members';
import Login from './Components/Profile/Login';
import Register from './Components/Profile/Register';
import ForgotPassword from './Components/Profile/ForgotPassword';
import HomePage from './Components/Profile/HomePage';
import Profile from './Components/Profile/Profile';
// import Logout from './Components/Profile/Logout'; Import your custom ProtectedRoute component
import RoleProtectedRoute from './RoleProtectedRoute'; // Import RoleProtectedRoute for role-based access control
import AdminDashboard from './Components/Users/Admin/AdminDashoard';
import CategoryManagement from './Components/Users/Admin/CategoryManagement';



export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Layout with nested routes */}
      <Route element={<Layout />}>
        {/* Protected routes */}
        <Route path="/dashboard" element={<RoleProtectedRoute><Dashboard /></RoleProtectedRoute>} />
        <Route path="/profile" element={<RoleProtectedRoute><Profile /></RoleProtectedRoute>} />
        <Route path="/report" element={<RoleProtectedRoute><Report /></RoleProtectedRoute>} />

        {/* Admin Routes with Role Protection */}
        <Route path="/adminDashboard" element={<RoleProtectedRoute requiredRole="admin"><AdminDashboard /></RoleProtectedRoute>} />
        <Route path="/admin/category-management" element={<RoleProtectedRoute requiredRole="admin"><CategoryManagement /></RoleProtectedRoute>} />
        <Route path="/members" element={<RoleProtectedRoute requiredRole="admin"><Members /></RoleProtectedRoute>} />
      </Route>
      {/* Catch-all redirect route */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
    );
}
