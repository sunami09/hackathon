
import React, { useState, useEffect } from 'react';
import GLSLRenderer from './babylon/GLSLRenderer';
import { SHADERS } from './babylon/shaders'; 
import { Cpu, Film,Grid3x3, Flame,GlassWater, Grid, Maximize, Brush, PenTool, Monitor, Wind, Waves, Sun, Zap, CircleDot } from 'lucide-react';


const ICONS = {
  pixalate: Cpu,
  posterize: Film,
  glass: GlassWater,
  glitch: Zap,
  dither: Grid,      
  barrel: Maximize,
  oilPainting: Brush,
  celShading: PenTool,
  crt: Monitor,
  swirl: Wind,
  barrel: Maximize,
  dotScreen: Grid3x3,
  burntEdges: Flame,
  ripple: Waves,
  heatHaze: Sun,  
  refraction: CircleDot,
};

const BabylonEffects = ({ image, onRenderedImage, hasImage, appliedFilters = [] }) => {
  const [availableShaders, setAvailableShaders] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [glslRenderer, setGlslRenderer] = useState(null);

  useEffect(() => {
    if (hasImage) setGlslRenderer(new GLSLRenderer());
  }, [hasImage]);

  
  useEffect(() => {
    setAvailableShaders(SHADERS);
  }, []);

  const handleApplyShader = async (shader) => {
    if (isProcessing || !glslRenderer || !image) return;
    setIsProcessing(true);
    try {
      const parameters = {};
      shader.parameters.forEach(param => {
        parameters[param.name] = param.default;
      });

      const newImageData = await glslRenderer.applyFilter(image, shader.fragmentShader, parameters);
      
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
      {}
      <div className="filter-grid">
        {availableShaders.map((shader) => {
            const Icon = ICONS[shader.id] || Cpu; 
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