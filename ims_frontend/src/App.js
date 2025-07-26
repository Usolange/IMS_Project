import { Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './Components/Profile/HomePage';
import Register from './Components/Profile/Register';
import ForgotPassword from './Components/Profile/ForgotPassword';
import ResetPasswordModal from './Components/Profile/ResetPasswordModal';
import ResetPasswordPage from './Components/Profile/ResetPasswordPage';

import Profile from './Components/Profile/Profile';

import GuestLayout from './Components/Users/Guests/files/GuestLayout';
import MemberManagementGuest from './Components/Users/Guests/files/MemberManagement';
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

import AdLayout from './Components/Users/Admin/adLayout';
import AdminDashboard from './Components/Users/Admin/AdminDashboard';
import FrequencyCategoryManagement from './Components/Users/Admin/ScheduleManagement/FrequencyCategoryManagement';
import AvailableDailySchedules from './Components/Users/Admin/ScheduleManagement/AvailableDailySchedules';
import TimeManager from './Components/Users/Admin/ScheduleManagement/TimeManager';
import LocationManager from './Components/Users/Admin/LocationManagement/LocationManager';
import AddLocation from './Components/Users/Admin/LocationManagement/AddLocation';
import IkiminaManagement from './Components/Users/Admin/IkiminaManagement/IkiminaManagement';
import AllIkiminaPage from './Components/Users/Admin/IkiminaManagement/AllIkiminaPage';
import AllMembers from './Components/Users/Admin/IkiminaManagement/Members';


import IkLayout from './Components/Users/Ikimina/ikLayout';
import IkiminaDashboard from './Components/Users/Ikimina/ikiminaDashboard';
import MemberManagementPage from './Components/Users/Ikimina/MemberManagement/MemberManagementPage';
import SavingRulesForm from './Components/Users/Ikimina/SavingManagement/SavingRulesForm';
import SavingDashboardPage from './Components/Users/Ikimina/SavingManagement/SavingDashboardPage';
import RoundManagement from './Components/Users/Ikimina/SavingManagement/RoundManagement';
import SlotManager from './Components/Users/Ikimina/SavingManagement/SlotManager';
import SavingManagementPage from './Components/Users/Ikimina/SavingManagement/SavingManagementPage';
import PenaltyLogsPage from './Components/Users/Ikimina/SavingManagement/PenaltyLogsPage';
import LoanInfoPage from './Components/Users/Ikimina/SavingManagement/LoanInfoPage';



import MeLayout from './Components/Users/Members/meLayout';
import MemberDashboard from './Components/Users/Members/MemberDashboard';
import MemberSavingManager from './Components/Users/Members/SavingManagement/MemberSavingManager';
import LoanManager from './Components/Users/Members/loanManagement/loanManager';

export default function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<HomePage />} />

      {/* Guest Routes */}
      <Route path="/guest" element={<GuestLayout />}>
        <Route path="member-management" element={<MemberManagementGuest />} />
        <Route path="financial-management" element={<FinancialManagement />} />
        <Route path="fraud-detection" element={<FraudDetection />} />
        <Route path="reporting-analytics" element={<ReportingAnalytics />} />
        <Route path="loan-management" element={<LoanManagement />} />
        <Route path="event-time-scheduling" element={<EventTimeScheduling />} />
        <Route path="real-time-notifications" element={<RealTimeNotifications />} />
      </Route>

      <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
      <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />
      <Route path="/forgot-password" element={<GuestOnlyRoute><ForgotPassword /></GuestOnlyRoute>} />
      <Route path="/logout" element={<Logout />} />

      {/* Admin Layout */}
      <Route element={<AdLayout />}>
        <Route path="/profile" element={<RoleProtectedRoute allowedRoles={['user', 'admin']}><Profile /></RoleProtectedRoute>} />
        <Route path="/adminDashboard" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminDashboard /></RoleProtectedRoute>} />
        <Route path="/FrequencyCategoryManagement" element={<RoleProtectedRoute allowedRoles={['admin']}><FrequencyCategoryManagement /></RoleProtectedRoute>} />
        <Route path="/TimeManager" element={<RoleProtectedRoute allowedRoles={['admin']}><TimeManager /></RoleProtectedRoute>} />
        <Route path="/LocationManager" element={<RoleProtectedRoute allowedRoles={['admin']}><LocationManager /></RoleProtectedRoute>} />
        <Route path="/AddLocation" element={<RoleProtectedRoute allowedRoles={['admin']}><AddLocation /></RoleProtectedRoute>} />
        <Route path="/IkiminaManagement" element={<RoleProtectedRoute allowedRoles={['admin']}><IkiminaManagement /></RoleProtectedRoute>} />
        <Route path="/AllIkiminaPage" element={<RoleProtectedRoute allowedRoles={['admin']}><AllIkiminaPage /></RoleProtectedRoute>} />
        <Route path="/AvailableDailySchedules" element={<RoleProtectedRoute allowedRoles={['admin']}><AvailableDailySchedules /></RoleProtectedRoute>} />
        <Route path="/AllMembersInSector" element={<RoleProtectedRoute allowedRoles={['admin']}><AllMembers /></RoleProtectedRoute>} />

      </Route>

      {/* Ikimina Layout */}
      <Route element={<IkLayout />}>
        <Route path="/ikiminaDashboard" element={<RoleProtectedRoute allowedRoles={['ikimina']}><IkiminaDashboard /></RoleProtectedRoute>} />
        <Route path="/penaltyLogsPage" element={<RoleProtectedRoute allowedRoles={['ikimina']}><PenaltyLogsPage /></RoleProtectedRoute>} />
        <Route path="/loanInfoPage" element={<RoleProtectedRoute allowedRoles={['ikimina']}><LoanInfoPage /></RoleProtectedRoute>} />
        <Route path="/MemberManagementPage" element={<RoleProtectedRoute allowedRoles={['ikimina']}><MemberManagementPage /></RoleProtectedRoute>}>
          <Route path="addNewMember" element={<MemberManagementPage />} />
          <Route path="addGuardianMember" element={<MemberManagementPage />} />
          <Route path="addMemberType" element={<MemberManagementPage />} />
        </Route>

        <Route path="/savingManagementPage" element={<RoleProtectedRoute allowedRoles={['ikimina']}><SavingManagementPage /></RoleProtectedRoute>}>
         <Route index element={<SavingDashboardPage />} />
          <Route path="rules" element={<SavingRulesForm />} />
          <Route path="rounds" element={<RoundManagement />} />
          <Route path="slots" element={<SlotManager />} />
        </Route>
      </Route>


      {/* Member Layout */}
      <Route element={<MeLayout />}>
        <Route path="/memberDashboard" element={<RoleProtectedRoute allowedRoles={['member']}><MemberDashboard /></RoleProtectedRoute>} />
        <Route path="/memberSavingManager" element={<RoleProtectedRoute allowedRoles={['member']}><MemberSavingManager /></RoleProtectedRoute>} />
        <Route path="/loanManager" element={<RoleProtectedRoute allowedRoles={['member']}><LoanManager /></RoleProtectedRoute>} />

      </Route>

      {/* Unauthorized */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
