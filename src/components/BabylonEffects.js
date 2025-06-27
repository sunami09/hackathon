import React, { useState, useEffect } from 'react';
import { 
    Cpu, Film, GlassWater, Signal, Grid, Maximize, Brush, PenTool,
    Monitor, Wind, Waves, Sun, Zap, CircleDot, Grid3x3, Flame,
    Sunrise, PenSquare
} from 'lucide-react';
import GLSLRenderer from './babylon/GLSLRenderer';
import { SHADERS } from './babylon/shaders';

const ICONS = {
    pixalate: Cpu,
    posterize: Film,
    frosted: GlassWater,
    glitch: Zap,
    dither: Grid,
    oilPainting: Brush,
    celShading: PenTool,
    crt: Monitor,
    swirl: Wind,
    barrel: Maximize,
    ripple: Waves,
    heatHaze: Sun,
    refraction: CircleDot,
    dotScreen: Grid3x3,
    burntEdges: Flame,
    dreamyGlow: Sunrise,
    crossHatch: PenSquare,
};

const BabylonEffects = ({ image, onRenderedImage, hasImage, appliedFilters = [], onUndo, onShowNotification = () => {} }) => {
  const [availableShaders, setAvailableShaders] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [glslRenderer, setGlslRenderer] = useState(null);

  useEffect(() => {
    if (hasImage) setGlslRenderer(new GLSLRenderer());
  }, [hasImage]);

  
  useEffect(() => {
    setAvailableShaders(SHADERS);
  }, []);

  const handleToggleShader = async (shader) => {
    if (isProcessing) return;

    const isLastApplied = appliedFilters.length > 0 && appliedFilters[appliedFilters.length - 1] === shader.id;

    if (isLastApplied) {
      onUndo();
      return;
    }

    const isApplied = appliedFilters.includes(shader.id);
    if (isApplied) {
      window.alert(`'${shader.name}' is applied before other effects. Undo other effects first.`);
      return;
    }

    setIsProcessing(true);
    try {
      const parameters = {};
      shader.parameters.forEach(param => {
        parameters[param.name] = param.default;
      });
      if (parameters.hasOwnProperty('time')) {
        parameters.time = (Date.now() / 1000.0) % 3600;
      }

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
      <div className="filter-grid">
        {availableShaders.map((shader) => {
            const Icon = ICONS[shader.id] || Cpu; 
            const isApplied = appliedFilters.includes(shader.id);

            return (
                <button
                    key={shader.id}
                    onClick={() => handleToggleShader(shader)}
                    disabled={isProcessing}
                    className={`filter-button ${isApplied ? 'active' : ''}`}
                    title={shader.description}
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