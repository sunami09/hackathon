// src/components/Effects.js

import React from 'react';
import Brightness from './effects/Brightness';
import Contrast from './effects/Contrast';
import Saturation from './effects/Saturation';
import Hue from './effects/Hue';
import Filters from './effects/Filters';
import BabylonEffects from './BabylonEffects';

// 1. Accept the new props from Sidebar.js
const Effects = ({ 
  effects, 
  onEffectChange, 
  hasImage,
  currentImage,
  onDestructiveChange,
  appliedFilters 
}) => {

  if (!hasImage) {
    return (
      <div className="effects-wrapper">
        <div className="placeholder-section">
          <h3>Effects & Filters</h3>
          <p className="placeholder-text">Upload an image to apply effects</p>
        </div>
        {/* Pass the simplified props that match the new architecture */}
        <BabylonEffects 
          image={null}
          onRenderedImage={onDestructiveChange}
          hasImage={false}
        />
      </div>
    );
}

  return (
    <div className="effects-wrapper">
      <div className="effects-section">
        <h3>Effects & Filters</h3>
        
        <div className="effects-container">
          <Brightness 
            value={effects.brightness} 
            onChange={(value) => onEffectChange('brightness', value)} 
          />
          <Contrast 
            value={effects.contrast} 
            onChange={(value) => onEffectChange('contrast', value)} 
          />
          <Saturation 
            value={effects.saturation} 
            onChange={(value) => onEffectChange('saturation', value)} 
          />
          <Hue 
            value={effects.hue} 
            onChange={(value) => onEffectChange('hue', value)} 
          />
          <Filters 
            activeFilters={effects.filters} 
            onFilterToggle={(filter) => onEffectChange('filters', filter)} 
          />
        </div>
      </div>

      <BabylonEffects 
        image={currentImage}
        onRenderedImage={onDestructiveChange} // Connects to the main handler
        hasImage={hasImage}
        appliedFilters={appliedFilters}
      />
    </div>
  );
};

export default Effects;