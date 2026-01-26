import React from 'react';

function FilterDropdown({ value, onChange, options, name, className = '' }) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`px-3 py-1.5 border-2 border-gray-200 rounded-lg text-gray-700 text-sm focus:outline-none shadow-sm transition-all bg-gray-50/50 ${className}`}
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
