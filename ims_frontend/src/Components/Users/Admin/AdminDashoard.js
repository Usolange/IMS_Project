import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import '../../CSS/Dashboard.css';

export default function Dashboard() {
  return (
    <div className="flex">
      <Navigation />
      <div className="flex-1 p-6">
        <Outlet /> {/* This will render the nested route content */}
      </div>
    </div>
  );
}
