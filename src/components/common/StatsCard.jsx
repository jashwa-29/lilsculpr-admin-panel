import React from 'react';

export const StatsCard = ({ label, value, subLabel, color = 'text-purple-600' }) => {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold text-muted uppercase tracking-wide">
        {label}
      </div>
      <div className={`font-nunito text-3xl font-extrabold leading-tight mt-1 ${color}`}>
        {value}
      </div>
      <div className="text-xs text-muted">{subLabel}</div>
    </div>
  );
};
