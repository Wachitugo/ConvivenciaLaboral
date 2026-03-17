import React from 'react';

function FilterDropdown({ value, onChange, options, name, className = '' }) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`px-3 py-1.5 border border-[#e2e8f0] rounded-xl text-[#475569] text-sm focus:outline-none focus:border-[#1A71B8]/40 focus:ring-4 focus:ring-[#1A71B8]/8 shadow-sm transition-all bg-[#f8fafc] ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default FilterDropdown;
