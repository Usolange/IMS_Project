import React, { useState, useEffect, useRef } from 'react';
import { Menu, ChevronLeft, Search } from 'lucide-react';
import { Outlet, Link, useNavigate, NavLink } from 'react-router-dom';
import { FaListAlt, FaChartBar, FaUsers, FaMoneyBill, FaCog } from 'react-icons/fa';
import axios from 'axios'; // ✅ you'll need this

import '../../CSS/Layout.css';

export default function MemberLayout() {
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [memberName, setMemberName] = useState('');
  const [memberCode, setMemberCode] = useState('');
  const [ikiminaName, setIkiminaName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

useEffect(() => {
  const member = JSON.parse(localStorage.getItem('user'));
  if (member) {
    setMemberName(member.member_names || 'Member');
    setMemberCode(member.member_code || '');
    setIkiminaName(member.ikimina_name || ''); // <-- use member.ikimina_name here
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
    const trimmed = searchQuery.trim();
    if (trimmed.length > 0) {
      console.log('Searching for:', trimmed);
    }
  };

  return (
    <div className="app-layout">
      <button className="sidebar-toggle-button" onClick={toggleSidebar} aria-label="Toggle sidebar">
        {isSidebarVisible ? <ChevronLeft size={28} /> : <Menu size={28} />}
      </button>

      <aside className={`sidebar ${isSidebarVisible ? '' : 'hidden'}`}>
        <nav className="sidebar-menu" aria-label="Sidebar">
          <ul className="menu-list">
            <li><NavLink to="/member-dashboard" className={({ isActive }) => isActive ? 'sidebar-itemikimina active' : 'sidebar-itemikimina'}><FaListAlt style={{ marginRight: '8px' }} />Dashboard</NavLink></li>
            <li><NavLink to="/my-savings" className={({ isActive }) => isActive ? 'sidebar-itemikimina active' : 'sidebar-itemikimina'}><FaMoneyBill style={{ marginRight: '8px' }} />My Savings</NavLink></li>
            <li><NavLink to="/my-loans" className={({ isActive }) => isActive ? 'sidebar-itemikimina active' : 'sidebar-itemikimina'}><FaChartBar style={{ marginRight: '8px' }} />My Loans</NavLink></li>
            <li><NavLink to="/settings" className={({ isActive }) => isActive ? 'sidebar-itemikimina active' : 'sidebar-itemikimina'}><FaCog style={{ marginRight: '8px' }} />Settings</NavLink></li>
          </ul>
        </nav>
      </aside>

      <div className={`main-wrapper ${isSidebarVisible ? '' : 'full-width'}`}>
        <header className="navbar" role="banner">
          <div className="navbar-titleikimina">Ikimina: {ikiminaName}</div>

          <div className="navbar-links">
            <div className="searching" role="search">
              <input
                type="text"
                placeholder="Search..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                aria-label="Search input"
              />
              <button type="button1" className="search-icon" onClick={handleSearch} aria-label="Search button">
                <Search size={18} />
              </button>
            </div>

            <div className="notification-icon" role="button" tabIndex={0}>
              🔔
            </div>

            <div className="username">{memberName} ({memberCode})</div>

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
                  <Link to="/profile" className="dropdown-link" role="menuitem" onClick={() => setShowDropdown(false)}>
                    Profile
                  </Link>
                  <button className="dropdown-link" role="menuitem" onClick={handleLogout}>
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
          © 2025 Ikimina Member System
        </footer>
      </div>
    </div>
  );
}
