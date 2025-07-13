import React, { useState, useEffect, useRef } from 'react';
import { Menu, ChevronLeft } from 'lucide-react';
import { Outlet, Link, useNavigate, NavLink } from 'react-router-dom';
import { FaChartBar, FaUsers, FaMoneyBill, FaCog, FaPiggyBank, FaExclamationTriangle } from 'react-icons/fa';
import '../../CSS/Layout.css';

const links = [
  { to: '/MemberManagement', icon: FaUsers, label: 'Member Management' },
  { to: '/report', icon: FaChartBar, label: 'Reports' },
  { to: '/members', icon: FaUsers, label: 'Members' },
  { to: '/savingManagement', icon: FaPiggyBank, label: 'Savings' },
  { to: '/penaltyManagement', icon: FaExclamationTriangle, label: 'Penalty Management' },
  { to: '/loans', icon: FaMoneyBill, label: 'Loans' },
  { to: '/settings', icon: FaCog, label: 'Settings' },
];

export default function Layout() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [userName, setUserName] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserName(user.name || 'Guest');
      setUserLocation([user.cell, user.village].filter(Boolean).join(' - '));
    }
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
      navigate('/');
    }, 2000);
  };

  return (
    <div className={`app-layout ${!sidebarVisible ? 'sidebar-hidden' : ''}`}>
      <button className="sidebar-toggle-button" onClick={() => setSidebarVisible(v => !v)} aria-label="Toggle sidebar">
        {sidebarVisible ? <ChevronLeft size={28} /> : <Menu size={28} />}
      </button>

      <aside className={`sidebar ${sidebarVisible ? '' : 'hidden'}`}>
        <nav className="sidebar-menu" aria-label="Sidebar">
          <ul className="menu-list">
            {links.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink to={to} className={({ isActive }) => (isActive ? 'nav-linkadmin active' : 'nav-linkadmin')}>
                  <Icon /> {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className={`main-wrapper ${!sidebarVisible ? 'full-width' : ''}`}>
        <header className="navbar" role="banner">
          <div className="navbar-titleadmin">Location: {userLocation}</div>
          <div className="navbar-links">
            <div className="notification-icon" role="button" tabIndex={0}>🔔</div>
            <div className="username">{userName}</div>
            <div className="profile-dropdown-wrapper" ref={dropdownRef}>
              <button
                className="profile-button"
                onClick={() => setDropdownOpen(open => !open)}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
                aria-label="User menu"
              >
                👤
              </button>
              {dropdownOpen && (
                <div className="dropdown-content" role="menu">
                  <Link to="/profile" className="dropdown-link" role="menuitem" onClick={() => setDropdownOpen(false)}>Profile</Link>
                  <button className="dropdown-link" role="menuitem" onClick={logout}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {toastVisible && <div className="toast-message" role="alert">👋 Logged out successfully</div>}

        <main className="main-content" role="main"><Outlet /></main>

        <footer className={`footer ${!sidebarVisible ? 'full-width' : ''}`}>© 2025 Ikimina Management System</footer>
      </div>
    </div>
  );
}
