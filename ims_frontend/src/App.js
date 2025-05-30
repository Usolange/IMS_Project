import { Routes, Route } from 'react-router-dom';
import Layout from './Components/Layout';
import Home from './Components/Profile/Home';
import Dashboard from './Components/Dashboard';
import Report from './Components/Report';
import Members from './Components/Member/Members';
import Login from './Components/Profile/Login';
import ProtectedRoute from './ProtectedRoute';
import RoleProtectedRoute from './Components/Auth/RoleProtectedRoute';
import Register from './Components/Profile/Register';
import ForgotPassword from './Components/Profile/ForgotPassword';

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Layout with nested routes */}
      <Route element={<Layout />}>
        {/* Only authenticated users */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <Report />
            </ProtectedRoute>
          }
        />
        {/* Members page only accessible to 'admin' role */}
        <Route
          path="/members"
          element={
            <RoleProtectedRoute requiredRole="admin">
              <Members />
            </RoleProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
