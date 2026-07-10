// Update lilsculpr-admin/src/components/layout/Sidebar.jsx

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', icon: '📊', label: 'Overview' },
  { path: '/batches', icon: '📅', label: 'Manage Batches' },
  { path: '/students', icon: '👦', label: 'All Students' },
  { path: '/fees', icon: '💰', label: 'Fee Tracking' },
  { path: '/attendance', icon: '✅', label: 'Attendance' },
  { path: '/waitlist', icon: '⏳', label: 'Waitlist' },
  { path: '/compensations', icon: '🎫', label: 'Compensations' },
  { path: '/birthdays', icon: '🎂', label: 'Birthdays' },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Listen for custom event from attendance components
  useEffect(() => {
    const handleUnsavedChange = (e) => {
      setHasUnsavedChanges(e.detail || false);
    };

    window.addEventListener('unsavedChanges', handleUnsavedChange);
    return () => window.removeEventListener('unsavedChanges', handleUnsavedChange);
  }, []);

  const handleNavigation = (e, path) => {
    // Only check if we're on an attendance page and there are unsaved changes
    if (hasUnsavedChanges && location.pathname.includes('/attendance')) {
      e.preventDefault();
      const confirmLeave = window.confirm(
        '⚠️ You have unsaved attendance changes.\n\nIf you leave now, your changes will be lost.\n\n• Click "OK" to leave without saving\n• Click "Cancel" to stay and save your changes'
      );
      if (confirmLeave) {
        setHasUnsavedChanges(false);
        navigate(path);
      }
    }
  };

  return (
    <div className="w-[220px] bg-sidebar flex-shrink-0 flex flex-col">
      <div className="px-4 py-5 border-b border-white/10">
        <img
          src="https://www.lilsculpr.com/assets/img/logo.webp"
          alt="Lil Sculpr"
          className="h-[42px]"
        />
        <p className="text-white/45 text-xs mt-1">Admin Dashboard</p>
      </div>

      <nav className="flex-1 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={(e) => handleNavigation(e, item.path)}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 text-white/65 text-sm font-semibold
              border-l-3 border-transparent transition-all duration-150
              hover:bg-white/5 hover:text-white
              ${isActive ? 'bg-primary/15 text-primary border-l-primary' : ''}
            `}
          >
            <span className="text-base w-6 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <a
          href="enroll.html"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-primary text-white text-center font-nunito font-extrabold text-sm py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
        >
          🎨 Open Enroll Form
        </a>
      </div>
    </div>
  );
};