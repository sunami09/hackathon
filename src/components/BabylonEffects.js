// src/components/BabylonEffects.js

import React, { useState, useEffect } from 'react';
import { Cpu } from 'lucide-react';
import GLSLRenderer from './babylon/GLSLRenderer';

const BabylonEffects = ({ image, onRenderedImage, hasImage, appliedFilters = [] }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [glslRenderer, setGlslRenderer] = useState(null);

  useEffect(() => {
    if (hasImage) setGlslRenderer(new GLSLRenderer());
  }, [hasImage]);

  const handleApplyPixalate = async () => {
    if (isProcessing || !glslRenderer || !image) return;
    setIsProcessing(true);
    try {
      const pixalateParams = { blockSize: 0.035 };
      const newImageData = await glslRenderer.applyFilter(image, 'pixalate', pixalateParams);
      onRenderedImage(newImageData, 'pixalate'); 
    } catch (error) {
      console.error("Failed to apply Pixalate filter:", error);
    }
    setIsProcessing(false);
  };
  
  const isPixalateApplied = appliedFilters.includes('pixalate');

  if (!hasImage) {
    // The placeholder when no image is loaded remains simple.
    return (
      <div className="placeholder-section">
        <h3>Babylon Effects</h3>
        <p className="placeholder-text">Upload an image to apply GLSL filters</p>
      </div>
    );
  }

  // MODIFIED: The entire JSX structure is updated to match the .effect-panel style
  return (
    <div className="effect-panel">
      <div className="effect-header">
        <Cpu size={16} className="effect-icon" />
        <span className="effect-label">Babylon Effects</span>
      </div>
      <div className="filter-grid">
        <button
          onClick={handleApplyPixalate}
          disabled={isProcessing || isPixalateApplied}
          className={`filter-button ${isPixalateApplied ? 'active' : ''}`}
          title={isPixalateApplied ? "Pixalate has already been applied" : "Apply a destructive Pixalate filter"}
        >
          {isProcessing ? <Cpu size={20} className="processing-icon"/> : <Cpu size={20} />}
          <span>Pixalate</span>
        </button>
        {/* You can add more buttons here in the future for other Babylon effects */}
      </div>
    </div>
  );
};

export default BabylonEffects;