import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar = () => {
  const { logout, admin } = useAuth();

  const navItems = [
    { name: 'Overview', path: '/', icon: '📊' },
    { name: 'Manage Batches', path: '/batches', icon: '📅' },
    { name: 'All Students', path: '/students', icon: '👥' },
    { name: 'Fee Tracking', path: '/fees', icon: '💰' },
    { name: 'Attendance', path: '/attendance', icon: '✅' },
    { name: 'Waitlist', path: '/waitlist', icon: '⏳' },
    { name: 'Compensations', path: '/compensations', icon: '🔄' },
    { name: 'Compensation Requests', path: '/compensation-requests', icon: '📝' },
    { name: 'Birthdays', path: '/birthdays', icon: '🎂' },
    { name: 'Manage Gallery', path: '/gallery', icon: '🖼️' },
    { name: 'Workshops', path: '/workshops', icon: '🎪' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#e8e4f0] flex flex-col min-h-screen">
      <div className="p-6 border-b border-[#e8e4f0]">
        <h1 className="text-2xl font-extrabold text-primary">Lil Sculpr</h1>
        <p className="text-sm text-gray-500 font-medium">Admin Panel</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                isActive 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-indigo-50 hover:text-primary'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[#e8e4f0]">
        <div className="mb-4 px-2">
          <p className="text-sm font-bold text-gray-800">{admin?.name || 'Admin'}</p>
          <p className="text-xs text-gray-500">{admin?.email || 'admin@lilsculpr.com'}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
};
