import React from 'react';

export const SearchBar = ({ value, onChange, placeholder }) => {
  return (
    <input
      type="search"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-xl border border-[#e8e4f0] bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
    />
  );
};
