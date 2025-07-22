import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ResetPasswordPage from './ResetPasswordPage';
import LoginPage from '../Auth/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* other routes */}
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
