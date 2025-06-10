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
import Logout from './Components/Profile/Logout';
import RoleProtectedRoute from './Components/Auth/RoleProtectedRoute';
import GuestOnlyRoute from './Components/Auth/GuestOnlyRoute';
import Unauthorized from './Components/Auth/Unauthorized';
import AdminDashboard from './Components/Users/Admin/AdminDashoard';
import CategoryManagement from './Components/Users/Admin/CategoryManagement';
import TimeScheduleManagement from './Components/Users/Admin/TimeScheduleManagement';



export default function App() {
  return (
    <Routes>
      {/* Public Home */}
      <Route path="/" element={<HomePage />} />

      {/* Guest-only routes */}
      <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
      <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />
      <Route path="/forgot-password" element={<GuestOnlyRoute><ForgotPassword /></GuestOnlyRoute>} />

      {/* Logout */}
      <Route path="/logout" element={<Logout />} />

      {/* Protected layout */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<RoleProtectedRoute allowedRoles={['user','admin']}><Dashboard /></RoleProtectedRoute>} />
        <Route path="/profile" element={<RoleProtectedRoute allowedRoles={['user','admin']}><Profile /></RoleProtectedRoute>} />
        <Route path="/report" element={<RoleProtectedRoute allowedRoles={['user','admin']}><Report /></RoleProtectedRoute>} />

        {/* Admin-only */}
        <Route path="/adminDashboard" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminDashboard /></RoleProtectedRoute>} />
        <Route path="/CategoryManagement" element={<RoleProtectedRoute allowedRoles={['admin']}><CategoryManagement /></RoleProtectedRoute>} />
        <Route path="/timeScheduleManagement" element={<RoleProtectedRoute allowedRoles={['admin']}><TimeScheduleManagement /></RoleProtectedRoute>} />
        <Route path="/members" element={<RoleProtectedRoute allowedRoles={['admin']}><Members /></RoleProtectedRoute>} />

        {/* Unauthorized fallback */}
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
