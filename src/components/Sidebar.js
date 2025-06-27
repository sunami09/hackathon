import React from 'react';
import ImageUpload from './ImageUpload';
import Effects from './Effects';

const Sidebar = ({ 
  onImageUpload, 
  effects, 
  onEffectChange, 
  hasImage,
  currentImage,
  onDestructiveChange,
  appliedFilters,
  onUndo,
  onShowNotification
}) => {
  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <h1>Image Editor</h1>
        <ImageUpload onImageUpload={onImageUpload} />
        <Effects 
          effects={effects}
          onEffectChange={onEffectChange}
          hasImage={hasImage}
          currentImage={currentImage}
          onDestructiveChange={onDestructiveChange}
          appliedFilters={appliedFilters}
          onUndo={onUndo}
        />
      </div>
    </div>
  );
};

export default Sidebar;