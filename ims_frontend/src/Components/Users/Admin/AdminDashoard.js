import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import { Auth } from '../../Auth/Auth'; // Ensure this path is correct
import '../../CSS/Dashboard.css';

export default function Dashboard() {
  const { user } = useContext(Auth);
  

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navigation />
      <div className="flex-1 p-6">
        <p className="text-right text-sm text-gray-600 mb-4">
          Welcome, <span className="font-semibold">{user?.name}</span> ({user?.role})
        </p>
        <Outlet /> {/* Nested route content goes here */}
      </div>
    </div>
  );
}
