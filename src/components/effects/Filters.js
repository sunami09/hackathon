import React from 'react';
import { Filter, Circle, Sparkles, RotateCcw } from 'lucide-react';

const filterOptions = [
  { name: 'blur', label: 'Blur', icon: Circle },
  { name: 'grayscale', label: 'Grayscale', icon: Filter },
  { name: 'sepia', label: 'Sepia', icon: Sparkles },
  { name: 'invert', label: 'Invert', icon: RotateCcw },
];

const Filters = ({ activeFilters, onFilterToggle }) => {
  const isActive = (filterName) => activeFilters.includes(filterName);

  return (
    <div className="effect-panel">
      <div className="effect-header">
        <Filter size={16} className="effect-icon" />
        <span className="effect-label">Filters</span>
      </div>
      <div className="filter-grid">
        {filterOptions.map(({ name, label, icon: Icon }) => (
          <button
            key={name}
            onClick={() => onFilterToggle(name)}
            className={`filter-button ${isActive(name) ? 'active' : ''}`}
            title={label}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Filters;