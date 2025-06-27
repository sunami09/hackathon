import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const ImageControls = ({ zoom, onZoomIn, onZoomOut, onReset, hasImage }) => {
  if (!hasImage) return null;

  return (
    <div className="controls-section">
      <h2>Image Controls</h2>
      <div className="controls-panel">
        <div className="controls-row">
          <span className="zoom-text">Zoom: {Math.round(zoom * 100)}%</span>
          <div className="button-group">
            <button 
              onClick={onZoomOut}
              className="control-button"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <button 
              onClick={onZoomIn}
              className="control-button"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button 
              onClick={onReset}
              className="control-button"
              title="Reset View"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
        <div className="help-text">
          <p>• Mouse wheel to zoom</p>
          <p>• Drag to pan when zoomed</p>
          <p>• Use controls above</p>
        </div>
      </div>
    </div>
  );
};

export default ImageControls;