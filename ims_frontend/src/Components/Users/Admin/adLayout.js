import React, { useState, useEffect, useRef } from 'react';
import { FaChartBar, FaMapMarkerAlt, FaClock, FaListAlt, FaUsers, FaUserFriends, FaMoneyBill, FaCog } from 'react-icons/fa';
import { Menu, ChevronLeft } from 'lucide-react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import '../../CSS/Layout.css';

export default function Layout() {
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [userName, setUserName] = useState('');
  const [userLocation, setUserLocation] = useState('');
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

  return (
    <div className="app-layout">
      {/* Sidebar Toggle Button */}
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
      <li>
        <NavLink to="/AdminDashboard" className={({ isActive }) => isActive ? 'nav-linkadmin active' : 'nav-linkadmin'}>
          <FaChartBar />Dashboard
        </NavLink>
      </li>
      <li>
        <NavLink to="/LocationManager" className={({ isActive }) => isActive ? 'nav-linkadmin active' : 'nav-linkadmin'}>
          <FaMapMarkerAlt />Create new Group
        </NavLink>
      </li>
      <li>
        <NavLink to="/TimeManager" className={({ isActive }) => isActive ? 'nav-linkadmin active' : 'nav-linkadmin'}>
          <FaClock />Manage Time
        </NavLink>
      </li>
      <li>
        <NavLink to="/AllIkiminaPage" className={({ isActive }) => isActive ? 'nav-linkadmin active' : 'nav-linkadmin'}>
          <FaListAlt />Manage Ikimina
        </NavLink>
      </li>
      <li>
        <NavLink to="/AllMembersInSector" className={({ isActive }) => isActive ? 'nav-linkadmin active' : 'nav-linkadmin'}>
          <FaUsers />Member Management
        </NavLink>
      </li>
      <li>
        <NavLink to="/report" className={({ isActive }) => isActive ? 'nav-linkadmin active' : 'nav-linkadmin'}>
          <FaChartBar />Reports
        </NavLink>
      </li>
    </ul>
  </nav>
</aside>



      {/* Main Section */}
      <div className={`main-wrapper ${isSidebarVisible ? '' : 'full-width'}`}>
        <header className="navbar" role="banner">
          <div className="navbar-titleadmin">Admin Sector: {userLocation}</div>

          <div className="navbar-links">

            <div className="notification-icon" role="button" tabIndex={0}>
              🔔
            </div>

            <div className="username">{userName}</div>


            <div className="profile-dropdown-wrapper" ref={dropdownRef}>
              <button
                className="profile-button"
                onClick={() => setShowDropdown((prev) => !prev)}
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
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {showToast && (
          <div className="toast-message" role="alert">
            👋 Logged out successfully
          </div>
        )}

        <main className="main-content" role="main">
          <Outlet />
        </main>

        <footer className={`footer ${isSidebarVisible ? '' : 'full-width'}`}>
          © 2025 Ikimina Management System
        </footer>
      </div>
    </div>
  );
}
