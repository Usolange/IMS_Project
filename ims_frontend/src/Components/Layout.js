import React, { useState, useEffect, useRef } from 'react';
import { Menu, ChevronLeft } from 'lucide-react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import './CSS/Layout.css';

export default function Layout() {
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [userName, setUserName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.name) setUserName(user.name);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSidebar = () => setSidebarVisible(prev => !prev);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate('/login');
    }, 2000);
  };

  const handleSearch = () => {
    if (searchQuery.trim() === '') return;
    console.log('Searching for:', searchQuery);
  };

  const handleDropdownSelect = (action) => {
    setShowDropdown(false);
    if (action === 'logout') handleLogout();
  };

  return (
    <div className="app-layout">
     
        <button className="sidebar-toggle-button" onClick={toggleSidebar}>
          {isSidebarVisible ? <ChevronLeft size={35} /> : <Menu size={20} />}
        </button>
      <aside className={`sidebar ${isSidebarVisible ? '' : 'hidden'}`}>
        
        <nav className="sidebar-menu">
          <Link to="/" className="sidebar-item">Dashboard</Link>
          <Link to="/report" className="sidebar-item">Reports</Link>
          <Link to="/members" className="sidebar-item">Members</Link>
          <Link to="/loans" className="sidebar-item">Loans</Link>
          <Link to="/settings" className="sidebar-item">Settings</Link>
        </nav>
      </aside>

      <div className={`main-wrapper ${isSidebarVisible ? '' : 'full-width'}`}>
        <header className="navbar">
           <div className="navbar-title">Ikimina Admin</div>
          <div className="navbar-links">
            <div className="search-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="search-icon" onClick={handleSearch}>🔍</button>
            </div>
            <div className="notification-icon">🔔</div>
            <div className="username">{userName || 'Guest'}</div>
            <div className="profile-dropdown-wrapper" ref={dropdownRef}>
              <button className="profile-button" onClick={() => setShowDropdown(prev => !prev)}>👤</button>
              {showDropdown && (
                <div className="dropdown-content">
                  <Link to="/profile" className="dropdown-link">Profile</Link>
                  <button className="dropdown-link" onClick={() => handleDropdownSelect('logout')}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>

        <footer className="footer">
          © 2025 Ikimina Management System
        </footer>
      </div>

      {showToast && <div className="toast-message">👋 Logged out successfully</div>}
    </div>
  );
}


