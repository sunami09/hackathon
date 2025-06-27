import React from 'react';
import Brightness from './effects/Brightness';
import Contrast from './effects/Contrast';
import Saturation from './effects/Saturation';
import Hue from './effects/Hue';
import Filters from './effects/Filters';
import BabylonEffects from './BabylonEffects';
import AIShaderGenerator from './AIShaderGenerator';

const Effects = ({ 
  effects, 
  onEffectChange, 
  hasImage,
  currentImage,
  onDestructiveChange,
  appliedFilters,
  onUndo,
  onGenerateAndApplyAIShader,
  isAIGenerating,
  trainingData,
  onDownloadTrainingData
}) => {

  if (!hasImage) {
    return (
      <div className="effects-wrapper">
        <AIShaderGenerator 
          onGenerateAndApply={onGenerateAndApplyAIShader}
          isProcessing={isAIGenerating}
          trainingData={trainingData}
          onDownload={onDownloadTrainingData}
        />
        <BabylonEffects 
          image={null}
          hasImage={false}
          appliedFilters={[]}
          onUndo={onUndo}
          onRenderedImage={onDestructiveChange}
        />
      </div>
    );
  }

  return (
    <div className="effects-wrapper">
      <BabylonEffects 
        image={currentImage}
        onRenderedImage={onDestructiveChange}
        hasImage={hasImage}
        appliedFilters={appliedFilters}
        onUndo={onUndo}
      />
      <AIShaderGenerator 
        onGenerateAndApply={onGenerateAndApplyAIShader}
        isProcessing={isAIGenerating}
        trainingData={trainingData}
        onDownload={onDownloadTrainingData}
      />
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
      
      
    </div>
  );
};

export default Effects;
