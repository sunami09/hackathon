// src/components/BabylonEffects.js

import React, { useState, useEffect } from 'react';
import { Cpu, Film, GlassWater } from 'lucide-react'; // Import icons for our shaders
import GLSLRenderer from './babylon/GLSLRenderer';
import { SHADERS } from './babylon/shaders'; // Import the new shader definitions

// Map icons to shader IDs for dynamic rendering
const ICONS = {
  pixalate: Cpu,
  posterize: Film,
  glass: GlassWater,
};

const BabylonEffects = ({ image, onRenderedImage, hasImage, appliedFilters = [] }) => {
  const [availableShaders, setAvailableShaders] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [glslRenderer, setGlslRenderer] = useState(null);

  useEffect(() => {
    if (hasImage) setGlslRenderer(new GLSLRenderer());
  }, [hasImage]);

  // Load shaders from the definition file
  useEffect(() => {
    setAvailableShaders(SHADERS);
  }, []);

  const handleApplyShader = async (shader) => {
    if (isProcessing || !glslRenderer || !image) return;
    setIsProcessing(true);
    try {
      // Get default parameters from the shader definition
      const parameters = {};
      shader.parameters.forEach(param => {
        parameters[param.name] = param.default;
      });

      // Pass the fragment shader source directly to the renderer
      const newImageData = await glslRenderer.applyFilter(image, shader.fragmentShader, parameters);
      
      // Notify the App of the destructive change with the shader's unique ID
      onRenderedImage(newImageData, shader.id); 

    } catch (error) {
      console.error(`Failed to apply shader '${shader.name}':`, error);
    }
    setIsProcessing(false);
  };
  
  if (!hasImage) {
    return (
      <div className="placeholder-section">
        <h3>Babylon Effects</h3>
        <p className="placeholder-text">Upload an image to apply GLSL filters</p>
      </div>
    );
  }

  return (
    <div className="effect-panel">
      <div className="effect-header">
        <Cpu size={16} className="effect-icon" />
        <span className="effect-label">Babylon Effects</span>
      </div>
      {/* Dynamically generate the filter grid from the shaders file */}
      <div className="filter-grid">
        {availableShaders.map((shader) => {
            const Icon = ICONS[shader.id] || Cpu; // Fallback to a default icon
            const isApplied = appliedFilters.includes(shader.id);

            return (
                <button
                    key={shader.id}
                    onClick={() => handleApplyShader(shader)}
                    disabled={isProcessing || isApplied}
                    className={`filter-button ${isApplied ? 'active' : ''}`}
                    title={isApplied ? `${shader.name} has been applied` : shader.description}
                >
                    <Icon size={20} />
                    <span>{shader.name}</span>
                </button>
            );
        })}
      </div>
    </div>
  );
};

export default BabylonEffects;