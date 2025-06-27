import React from 'react';
import { Palette } from 'lucide-react';

const Hue = ({ value, onChange }) => {
  return (
    <div className="effect-panel">
      <div className="effect-header">
        <Palette size={16} className="effect-icon" />
        <span className="effect-label">Hue</span>
        <span className="effect-value">{value > 0 ? '+' : ''}{value}°</span>
      </div>
      <div className="effect-control">
        <input
          type="range"
          min="-180"
          max="180"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="effect-slider hue-slider"
        />
        <div className="effect-range-labels">
          <span>-180°</span>
          <span>0°</span>
          <span>+180°</span>
        </div>
      </div>
    </div>
  );
};

export default Hue;