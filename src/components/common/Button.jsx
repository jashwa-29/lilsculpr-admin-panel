import React from 'react';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  secondary: 'bg-secondary text-white hover:bg-indigo-700',
  outline: 'bg-white text-gray-700 border border-[#e8e4f0] hover:border-primary hover:text-primary',
  green: 'bg-green-500 text-white hover:bg-green-600',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'font-bold rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
