import React, { useState, useEffect, useRef } from 'react';
import {
  Menu, ChevronLeft, ChevronRight, SlidersHorizontal, RotateCw,
  LayoutGrid, BarChart2, ListChecks, AlertTriangle
} from 'lucide-react';
import { Outlet, Link, useLocation, useNavigate, NavLink } from 'react-router-dom';
import {
  FaUsers, FaMoneyBill, FaCog, FaPiggyBank, FaExclamationTriangle
} from 'react-icons/fa';
import '../../CSS/Layout.css';

const links = [
  { to: '/IkiminaDashboard', icon: FaUsers, label: 'Dashboard' },
  {
    to: '/MemberManagementPage', icon: FaUsers, label: 'Member Management',
    children: [
      { to: '/MemberManagementPage/addMemberType', label: 'Add Member Type', icon: SlidersHorizontal },
      { to: '/MemberManagementPage/addGuardianMember', label: 'Add Guardian Member', icon: RotateCw },
      { to: '/MemberManagementPage/addNewMember', label: 'Add New Member', icon: LayoutGrid }
    ]
  },
  {
    to: '/savingManagementPage', icon: FaPiggyBank, label: 'Savings',
    children: [
      { to: '/savingManagementPage/rounds', label: 'Manage Rounds', icon: RotateCw },
      { to: '/savingManagementPage/slots', label: 'Manage Slots', icon: LayoutGrid },
      { to: '/savingManagementPage/rules', label: 'Saving Rules', icon: SlidersHorizontal },
    ]
  },
  { to: '/penaltyLogsPage', icon: FaExclamationTriangle, label: 'Penalties' },
  { to: '/loanInfoPage', icon: FaMoneyBill, label: 'Loans' },
];

export default function Layout() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [openMenu, setOpenMenu] = useState(null);
  const [userName, setUserName] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load user info once on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserName(user.name || 'Guest');
      setUserLocation([user.cell, user.village].filter(Boolean).join(' - '));
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Auto-open submenu if current route matches child route
  useEffect(() => {
    const activeParent = links.find(({ children }) =>
      children && children.some(child => location.pathname.startsWith(child.to))
    );
    if (activeParent) {
      setOpenMenu(activeParent.to);
    } else {
      setOpenMenu(null);
    }
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
      navigate('/');
    }, 2000);
  };

  const handleMenuClick = (to, hasChildren) => {
    // Toggle submenu open only if has children
    setOpenMenu(prev => (prev === to ? null : hasChildren ? to : null));
  };

  return (
    <div className={`app-layout ${!sidebarVisible ? 'sidebar-hidden' : ''}`}>
      <button
        className="sidebar-toggle-button"
        onClick={() => setSidebarVisible(v => !v)}
        aria-label="Toggle sidebar"
      >
        {sidebarVisible ? <ChevronLeft size={28} /> : <Menu size={28} />}
      </button>

      <aside className={`sidebar ${sidebarVisible ? '' : 'hidden'}`}>
        <nav className="sidebar-menu" aria-label="Sidebar">
          <ul className="menu-list">
            {links.map(({ to, icon: Icon, label, children }) => {
              const isOpen = openMenu === to;
              return (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) => 'nav-linkadmin' + (isActive || isOpen ? ' active' : '')}
                    onClick={() => handleMenuClick(to, !!children)}
                  >
                    {Icon && <Icon />}
                    {label}
                    {children && <ChevronRight className={`arrow-icon ${isOpen ? 'open' : ''}`} size={16} />}
                  </NavLink>
                  {children && (
                    <ul className={`submenu-list ${isOpen ? 'open' : ''}`}>
                      {children.map(({ to: subTo, label: subLabel, icon: SubIcon }) => (
                        <li key={subTo}>
                          <NavLink
                            to={subTo}
                            className={({ isActive }) => 'nav-sublinkadmin' + (isActive ? ' active' : '')}
                          >
                            {SubIcon && <SubIcon size={14} style={{ marginRight: '6px' }} />}
                            {subLabel}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
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
                  <Link
                    to="/profile"
                    className="dropdown-link"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <button className="dropdown-link" role="menuitem" onClick={logout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {toastVisible && <div className="toast-message" role="alert">👋 Logged out successfully</div>}

        <main className="main-content" role="main"><Outlet /></main>
        <footer className={`footer ${!sidebarVisible ? 'full-width' : ''}`}>
          © 2025 Ikimina Management System
        </footer>
      </div>
    </div>
  );
}
