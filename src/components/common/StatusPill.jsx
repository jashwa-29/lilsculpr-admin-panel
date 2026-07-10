import React from 'react';

const variants = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
};

export const StatusPill = ({ variant = 'gray', children, className = '' }) => {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
