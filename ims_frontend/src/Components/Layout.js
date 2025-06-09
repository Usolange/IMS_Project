// src/Components/Layout.js
import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import './CSS/Layout.css';

export default function Layout() {
  const [isSidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(v => !v);
  };

  return (
    <div className="layout-container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          Ikimina Admin

           <button className="menu-toggle" onClick={toggleSidebar}>
            ☰
          </button>
        </div>
        <div className="header-right">
          <div className="search-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="notification-icon">🔔</div>
          <div className="user-name">John Doe</div>
          <div className="profile-dropdown">
            <button className="profile-button">👤</button>
            <div className="dropdown-content">
              <Link to="/">Profile</Link>
              <Link to="/">Logout</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarVisible ? '' : 'hidden'}`}>
          <nav className="sidebar-nav">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/report" className="nav-link">Reports</Link>
          <Link to="/members" className="nav-link">Members</Link>
          <Link to="/loans" className="nav-link">Loans</Link>
          <Link to="/settings" className="nav-link">Settings</Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer">
        © 2025 Ikimina Management System
      </footer>
    </div>
  );
}
