import React, { useState, useEffect, useRef } from 'react';
import { Menu, ChevronLeft } from 'lucide-react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import './CSS/Layout.css';

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
      setUserLocation(user.userLocation || '');
    }
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
      navigate('/');
    }, 2000);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
    }
  };

  const handleDropdownSelect = (action) => {
    setShowDropdown(false);
    if (action === 'logout') handleLogout();
  };

  return (
    <div className="app-layout">
      {/* Toggle Sidebar Button */}
      <button
        className="sidebar-toggle-button"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {isSidebarVisible ? <ChevronLeft size={28} /> : <Menu size={28} />}
      </button>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarVisible ? '' : 'hidden'}`}>
        <nav className="sidebar-menu" aria-label="Sidebar">
          <ul className="menu-list">
            <li><Link to="/" className="sidebar-item">Dashboard</Link></li>
            <li><Link to="/report" className="sidebar-item">Reports</Link></li>
            <li><Link to="/members" className="sidebar-item">Members</Link></li>
            <li><Link to="/loans" className="sidebar-item">Loans</Link></li>
            <li><Link to="/settings" className="sidebar-item">Settings</Link></li>
          </ul>
        </nav>
      </aside>

      {/* Main Section */}
      <div className={`main-wrapper ${isSidebarVisible ? '' : 'full-width'}`}>
        {/* Navbar */}
        <header className="navbar" role="banner">
          <div className="navbar-title">
            Sector: {userLocation}
          </div>

          <div className="navbar-links">
            <div className="search-wrapper" role="search">
              <input
                type="text"
                className="search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                aria-label="Search input"
              />
              <button
                className="search-icon"
                onClick={handleSearch}
                aria-label="Search button"
              >
                🔍
              </button>
            </div>

            <div
              className="notification-icon"
              role="button"
              aria-label="Notifications"
              tabIndex={0}
            >
              🔔
            </div>

            <div className="username">{userName}</div>

            <div className="profile-dropdown-wrapper" ref={dropdownRef}>
              <button
                className="profile-button"
                onClick={() => setShowDropdown(prev => !prev)}
                aria-haspopup="true"
                aria-expanded={showDropdown}
                aria-label="User menu"
              >
                👤
              </button>
              {showDropdown && (
                <div className="dropdown-content" role="menu">
                  <Link
                    to="/profile"
                    className="dropdown-link"
                    role="menuitem"
                    onClick={() => setShowDropdown(false)}
                  >
                    Profile
                  </Link>
                  <button
                    className="dropdown-link"
                    role="menuitem"
                    onClick={() => handleDropdownSelect('logout')}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Toast Message */}
        {showToast && (
          <div className="toast-message" role="alert">
            👋 Logged out successfully
          </div>
        )}

        {/* Main Content */}
        <main className="main-content" role="main">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className={`footer ${isSidebarVisible ? '' : 'full-width'}`}>
          © 2025 Ikimina Management System
        </footer>
      </div>
    </div>
  );
}
