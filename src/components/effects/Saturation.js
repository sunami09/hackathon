import React from 'react';
import { Droplets } from 'lucide-react';

const Saturation = ({ value, onChange }) => {
  return (
    <div className="effect-panel">
      <div className="effect-header">
        <Droplets size={16} className="effect-icon" />
        <span className="effect-label">Saturation</span>
        <span className="effect-value">{value > 0 ? '+' : ''}{value}</span>
      </div>
      <div className="effect-control">
        <input
          type="range"
          min="-100"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="effect-slider"
        />
        <div className="effect-range-labels">
          <span>-100</span>
          <span>0</span>
          <span>+100</span>
        </div>
      </div>
    </div>
  );
};

export default Saturation;