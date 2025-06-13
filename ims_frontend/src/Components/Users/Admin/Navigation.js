import React from 'react';
import { Link } from 'react-router-dom';

export default function Navigation() {
  return (
    <nav className="w-64 h-screen bg-gray-800 text-white p-6 flex flex-col">
      <h2 className="text-2xl font-bold mb-8 select-none">Admin Dashboard</h2>
      <ul className="flex flex-col gap-4">
        <li>
          <Link
            to="/CategoryManagement"
            className="block px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700 focus:outline-none transition-colors"
          >
            Manage Frequency Categories
          </Link>
        </li>
        <li>
          <Link
            to="/timeScheduleManagement"
            className="block px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700 focus:outline-none transition-colors"
          >
            Set Time for Frequency
          </Link>
        </li>
        <li>
          <Link
            to="/IkiminaManagement"
            className="block px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700 focus:outline-none transition-colors"
          >
            Create Ikimina Group
          </Link>
        </li>
      </ul>
    </nav>
  );
}
