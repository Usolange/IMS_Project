import React from 'react';
import { Link } from 'react-router-dom';
import '../../CSS/Navigation.css'

export default function Navigation() {
  return (
    <nav className="nav-sidebar">
  <h2 className="nav-title">Admin Dashboard</h2>
  <ul className="nav-list">
     <li>
      <Link to="/LocationManager" className="nav-link">
        Manage Location
      </Link>
    </li>
    {/* <li>
      <Link to="/CategoryManagement" className="nav-link">
        Manage Frequency Categories
      </Link>
    </li> */}
    <li>
      <Link to="/TimeManager" className="nav-link">
        Manage Time
      </Link>
    </li>
    <li>
      <Link to="/AllIkiminaPage" className="nav-link">
        Create Ikimina Group
      </Link>
    </li>
  </ul>
</nav>

  );
}

