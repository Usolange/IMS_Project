import React from 'react';
import { Link } from 'react-router-dom';

export default function Navigation() {
  return (
    <div className="w-64 h-screen bg-gray-800 text-white p-4">
      <h2 className="text-xl font-bold mb-6">Admin Dashboard</h2>
      <ul className="space-y-4">
        <li>
          <Link to="/CategoryManagement" className="hover:underline">
            Manage Frequency Categories
          </Link>
        </li>
         <li>
          <Link to="/timeScheduleManagement" className="hover:underline">
            Set Time for Frequency
          </Link>
        </li>
        <li>
          <Link to="/ikiminaManagement" className="hover:underline">
            Create Ikimina Group
          </Link>
        </li>
       
      </ul>
    </div>
  );
}
