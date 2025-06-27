// src/components/ImageViewer.js

import React, { useState, useRef, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import FloatingControls from './FloatingControls';

// This helper function generates the real-time CSS filter string for sliders.
// It intentionally ignores the destructive filters (blur, grayscale, etc.)
// which are already "baked" into the processed image.
function getRealtimeCssFilterString(effects) {
    if (!effects || typeof effects !== 'object') return 'none';
    const filters = [];
    if (effects.brightness) filters.push(`brightness(${1 + (effects.brightness / 100)})`);
    if (effects.contrast) filters.push(`contrast(${1 + (effects.contrast / 100)})`);
    if (effects.saturation) filters.push(`saturate(${1 + (effects.saturation / 100)})`);
    if (effects.hue) filters.push(`hue-rotate(${effects.hue}deg)`);
    return filters.length > 0 ? filters.join(' ') : 'none';
}

const ImageViewer = ({ 
    image, 
    effects, 
    zoom, 
    onZoomChange, 
    onZoomIn, 
    onZoomOut, 
    onResetView,
    onUndo,
    onResetAll,
    canUndo,
    canReset
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (image) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(Math.max(zoom * delta, 0.1), 5);
      onZoomChange(newZoom);
    }
  };

  useEffect(() => {
    if (zoom === 1) setPosition({ x: 0, y: 0 });
  }, [zoom]);

  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, [image]);

  return (
    <div className="image-viewer">
      {image && (
        <FloatingControls 
          zoom={zoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onResetView={onResetView}
          onUndo={onUndo}
          onResetAll={onResetAll}
          canUndo={canUndo}
          canReset={canReset}
        />
      )}
      {image ? (
        <div 
          className={`image-container ${zoom > 1 ? (isDragging ? 'dragging' : 'draggable') : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <img 
            ref={imageRef}
            src={image} 
            alt="Processed" 
            className={`viewer-image ${isDragging ? 'no-transition' : ''}`}
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transformOrigin: 'center center',
              filter: getRealtimeCssFilterString(effects)
            }}
            draggable={false}
          />
        </div>
      ) : (
        <div className="empty-state">
          <ImageIcon className="empty-icon" size={96} />
          <p className="empty-title">No image selected</p>
          <p className="empty-subtitle">Upload an image to get started</p>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;