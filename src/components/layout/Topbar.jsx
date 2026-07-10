import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../common/Button';

export const Topbar = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isStudentsPage = location.pathname === '/students';

  const handleAddStudent = () => {
    navigate('/students?addStudent=1');
  };

  return (
    <header className="bg-white border-b border-[#e8e4f0] px-6 py-3 flex items-center justify-between flex-wrap gap-3">
      <h2 className="font-nunito text-lg font-extrabold">{title}</h2>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="bg-orange-50 text-primary-dark border border-orange-200 rounded-full px-3 py-1 text-xs font-bold">
          {today}
        </span>
        <Button variant="secondary" size="sm" onClick={handleAddStudent}>➕ Add Student</Button>
        <Button variant="outline" size="sm">⬇ Export CSV</Button>
      </div>
    </header>
  );
};
