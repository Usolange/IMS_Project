// src/App.js
import { Routes, Route } from 'react-router-dom';
import Layout from './Components/Layout';
import Dashboard from './Components/Dashboard';
import Report from './Components/Report';
import Members from './Components/Members'

export default function App() {
  return (
   <Routes>
  <Route element={<Layout />}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/report" element={<Report />} />
    <Route path="/members" element={<Members />} /> {/* Updated path */}
  </Route>
</Routes>

  );
}
