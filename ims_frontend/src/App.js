import { Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './Components/Profile/HomePage';
import Register from './Components/Profile/Register';
import ForgotPassword from './Components/Profile/ForgotPassword';
import Profile from './Components/Profile/Profile';

import GuestLayout from './Components/Users/Guests/files/GuestLayout';
import MemberManagement from './Components/Users/Guests/files/MemberManagement';
import EventTimeScheduling from './Components/Users/Guests/files/EventTimeScheduling';
import FraudDetection from './Components/Users/Guests/files/FraudDetection';
import LoanManagement from './Components/Users/Guests/files/LoanManagement';
import RealTimeNotifications from './Components/Users/Guests/files/RealTimeNotifications';
import ReportingAnalytics from './Components/Users/Guests/files/ReportingAnalytics';
import FinancialManagement from './Components/Users/Guests/files/FinancialManagement';

import Login from './Components/Auth/Login';
import Logout from './Components/Auth/Logout';
import GuestOnlyRoute from './Components/Auth/GuestOnlyRoute';
import RoleProtectedRoute from './Components/Auth/RoleProtectedRoute';
import Unauthorized from './Components/Auth/Unauthorized';

import Layout from './Components/Layout';
import Dashboard from './Components/Users/IkiminaManager/Dashboard';
import Report from './Components/Users/IkiminaManager/Report';
import Members from './Components/Member/Members';



import AdLayout from './Components/Users/Admin/adLayout';
import AdminDashboard from './Components/Users/Admin/AdminDashoard';
import FrequencyCategoryManagement from './Components/Users/Admin/ScheduleManagement/FrequencyCategoryManagement';
import AvailableDailySchedules from './Components/Users/Admin/ScheduleManagement/AvailableDailySchedules';
import TimeManager from './Components/Users/Admin/ScheduleManagement/TimeManager';
import LocationManager from './Components/Users/Admin/LocationManagement/LocationManager';
import AddLocation from './Components/Users/Admin/LocationManagement/AddLocation';


import IkLayout from './Components/Users/IkiminaManager/ikLayout';
import IkiminaDashboard from './Components/Users/IkiminaManager/ikiminaDashboard';
import IkiminaManagement from './Components/Users/Admin/CreateIkimina/IkiminaManagement';
import AllIkiminaPage from './Components/Users/Admin/CreateIkimina/AllIkiminaPage';

export default function App() {
  return (
    <Routes>
      {/* Public Home */}
      <Route path="/" element={<HomePage />} />

      {/* Guest layout wrapper */}
      <Route path="/guest" element={<GuestLayout />}>
        <Route path="member-management" element={<MemberManagement />} />
        <Route path="financial-management" element={<FinancialManagement />} />
        <Route path="fraud-detection" element={<FraudDetection />} />
        <Route path="reporting-analytics" element={<ReportingAnalytics />} />
        <Route path="loan-management" element={<LoanManagement />} />
        <Route path="event-time-scheduling" element={<EventTimeScheduling />} />
        <Route path="real-time-notifications" element={<RealTimeNotifications />} />
      </Route>

      {/* Guest-only routes */}
      <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
      <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />
      <Route path="/forgot-password" element={<GuestOnlyRoute><ForgotPassword /></GuestOnlyRoute>} />

      {/* Logout */}
      <Route path="/logout" element={<Logout />} />

      {/* Authenticated layout */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<RoleProtectedRoute allowedRoles={['user', 'admin']}><Dashboard /></RoleProtectedRoute>} />
        <Route path="/profile" element={<RoleProtectedRoute allowedRoles={['user', 'admin']}><Profile /></RoleProtectedRoute>} />
        <Route path="/report" element={<RoleProtectedRoute allowedRoles={['user', 'admin']}><Report /></RoleProtectedRoute>} />
        <Route path="/dashboard" element={<RoleProtectedRoute allowedRoles={['user', 'admin']}><Dashboard /></RoleProtectedRoute>} />
        <Route path="/profile" element={<RoleProtectedRoute allowedRoles={['user', 'admin']}><Profile /></RoleProtectedRoute>} />
        <Route path="/report" element={<RoleProtectedRoute allowedRoles={['user', 'admin']}><Report /></RoleProtectedRoute>} />
      </Route>

 {/* Admin routes */}
      <Route element={<AdLayout />}> 
        <Route path="/adminDashboard" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminDashboard /></RoleProtectedRoute>} />
        <Route path="/FrequencyCategoryManagement" element={<RoleProtectedRoute allowedRoles={['admin']}><FrequencyCategoryManagement /></RoleProtectedRoute>} />
        <Route path="/TimeManager" element={<RoleProtectedRoute allowedRoles={['admin']}><TimeManager /></RoleProtectedRoute>} />
        <Route path="/LocationManager" element={<RoleProtectedRoute allowedRoles={['admin']}><LocationManager /></RoleProtectedRoute>} />
        <Route path="/AddLocation" element={<RoleProtectedRoute allowedRoles={['admin']}><AddLocation /></RoleProtectedRoute>} />
        <Route path="/IkiminaManagement" element={<RoleProtectedRoute allowedRoles={['admin']}><IkiminaManagement /></RoleProtectedRoute>} />
        <Route path="/AllIkiminaPage" element={<RoleProtectedRoute allowedRoles={['admin']}><AllIkiminaPage /></RoleProtectedRoute>} />
        <Route path="/AvailableDailySchedules" element={<RoleProtectedRoute allowedRoles={['admin']}><AvailableDailySchedules /></RoleProtectedRoute>} />
        <Route path="/members" element={<RoleProtectedRoute allowedRoles={['admin']}><Members /></RoleProtectedRoute>} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>

      {/* Ikimina routes for 'ikimina' role */}
      <Route element={<IkLayout />}>
        <Route path="/ikiminaDashboard" element={<RoleProtectedRoute allowedRoles={['ikimina']}><IkiminaDashboard /></RoleProtectedRoute>} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>


      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
