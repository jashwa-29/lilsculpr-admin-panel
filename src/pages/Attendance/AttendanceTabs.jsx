// File: lilsculpr-admin/src/pages/Attendance/AttendanceTabs.jsx

import React, { useState } from 'react';
import Attendance from './Attendance'; // Daily view
import MonthlyAttendance from './MonthlyAttendance'; // Monthly view

export const AttendanceTabs = () => {
  const [activeTab, setActiveTab] = useState('daily');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'daily'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-gray-700'
          }`}
        >
          📅 Daily View
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'monthly'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-gray-700'
          }`}
        >
          📋 Monthly Register
        </button>
      </div>

      {/* Content */}
      {activeTab === 'daily' ? <Attendance /> : <MonthlyAttendance />}
    </div>
  );
};

export default AttendanceTabs;