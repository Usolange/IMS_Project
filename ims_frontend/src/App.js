import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Components/Layout';
import Dashboard from './Components/Dashboard';
import Report from './Components/Report';
import Members from './Components/Member/Members';
import Login from './Components/Home/Login';
import Register from './Components/Home/Register';
import ForgotPassword from './Components/Home/ForgotPassword';
import Homepage from './Components/Home/Homepage';
import Profile from './Components/Home/Profile';
import Logout from './Components/Home/Logout';
import ProtectedRoute from './ProtectedRoute'; // Import your custom ProtectedRoute component
import RoleProtectedRoute from './Components/Auth/RoleProtectedRoute'; // Import RoleProtectedRoute for role-based access control
import AdminDashboard from './Components/AdminDashboard';




export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Homepage />} />
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
        <Route path="/admin/dashboard" element={<RoleProtectedRoute requiredRole="admin"><AdminDashboard /></RoleProtectedRoute>} />
        <Route path="/admin/category-management" element={<RoleProtectedRoute requiredRole="admin"><CategoryManagement /></RoleProtectedRoute>} />
        <Route path="/members" element={<RoleProtectedRoute requiredRole="admin"><Members /></RoleProtectedRoute>} />
      </Route>
      {/* Catch-all redirect route */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
    );
}
