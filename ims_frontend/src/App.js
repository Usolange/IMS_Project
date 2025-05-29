// src/App.js
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Components/Dashboard';
import Report from './Components/Report';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/report" element={<Report />} />
    </Routes>
  );
}
