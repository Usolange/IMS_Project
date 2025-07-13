import React, { useState, useEffect, useRef } from 'react';
import { Menu, ChevronLeft, Search } from 'lucide-react';
import { Outlet, Link, useNavigate, NavLink } from 'react-router-dom';
import { FaChartBar, FaUsers, FaMoneyBill, FaCog, FaPiggyBank, FaExclamationTriangle } from 'react-icons/fa';
import '../../CSS/Layout.css';

export default function Layout() {
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [userName, setUserName] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);
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
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSidebar = () => setSidebarVisible((prev) => !prev);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate('/');
    }, 2000);
  };

  const handleSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) console.log('Searching for:', trimmed);
  };

  return (
    <div className="app-layout">
      <button className="sidebar-toggle-button" onClick={toggleSidebar} aria-label="Toggle sidebar">
        {isSidebarVisible ? <ChevronLeft size={28} /> : <Menu size={28} />}
      </button>

      <aside className={`sidebar ${isSidebarVisible ? '' : 'hidden'}`}>
        <nav className="sidebar-menu" aria-label="Sidebar">
          <ul className="menu-list">
            <li><NavLink to="/MemberManager" className={({ isActive }) => isActive ? 'sidebar-itemikimina active' : 'sidebar-itemikimina'}><FaUsers style={{ marginRight: '8px' }} />Member Management</NavLink></li>
            <li><NavLink to="/report" className={({ isActive }) => isActive ? 'sidebar-itemikimina active' : 'sidebar-itemikimina'}><FaChartBar style={{ marginRight: '8px' }} />Reports</NavLink></li>
            <li><NavLink to="/members" className={({ isActive }) => isActive ? 'sidebar-itemikimina active' : 'sidebar-itemikimina'}><FaUsers style={{ marginRight: '8px' }} />Members</NavLink></li>
            <li><NavLink to="/savingManagement" className={({ isActive }) => isActive ? 'sidebar-itemikimina active' : 'sidebar-itemikimina'}><FaPiggyBank style={{ marginRight: '8px' }} />Savings</NavLink></li>
            <li><NavLink to="/penaltyManagement" className={({ isActive }) => isActive ? 'sidebar-itemikimina active' : 'sidebar-itemikimina'}><FaExclamationTriangle  style={{ marginRight: '8px' }} />Penalty Management</NavLink></li>
            <li><NavLink to="/loans" className={({ isActive }) => isActive ? 'sidebar-itemikimina active' : 'sidebar-itemikimina'}><FaMoneyBill style={{ marginRight: '8px' }} />Loans</NavLink></li>
            <li><NavLink to="/settings" className={({ isActive }) => isActive ? 'sidebar-itemikimina active' : 'sidebar-itemikimina'}><FaCog style={{ marginRight: '8px' }} />Settings</NavLink></li>
          </ul>
        </nav>
      </aside>

      <div className={`main-wrapper ${isSidebarVisible ? '' : 'full-width'}`}>
        <header className="navbar">
          <div className="navbar-titleikimina">Location: {userLocation}</div>
          <div className="navbar-links">
            <div className="searching">
              <input type="text" placeholder="Search..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} aria-label="Search input" />
              <button className="search-icon" onClick={handleSearch} aria-label="Search button"><Search size={18} /></button>
            </div>
            <div className="notification-icon" role="button" tabIndex={0}>🔔</div>
            <div className="username">{userName}</div>
            <div className="profile-dropdown-wrapper" ref={dropdownRef}>
              <button className="profile-button" onClick={() => setShowDropdown((prev) => !prev)} aria-haspopup="true" aria-expanded={showDropdown} aria-label="User menu">👤</button>
              {showDropdown && (
                <div className="dropdown-content" role="menu">
                  <Link to="/profile" className="dropdown-link" role="menuitem" onClick={() => setShowDropdown(false)}>Profile</Link>
                  <button className="dropdown-link" role="menuitem" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {showToast && <div className="toast-message" role="alert">👋 Logged out successfully</div>}

        <main className="main-content" role="main">
          <Outlet />
        </main>

        <footer className={`footer ${isSidebarVisible ? '' : 'full-width'}`}>© 2025 Ikimina Management System</footer>
      </div>
    </div>
  );
}
