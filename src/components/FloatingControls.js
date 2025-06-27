

import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Undo2, XCircle } from 'lucide-react';

const FloatingControls = ({ 
    zoom, 
    onZoomIn, 
    onZoomOut, 
    onResetView, 
    onUndo, 
    onResetAll,
    canUndo,
    canReset
}) => {
  return (
    <div className="floating-controls">
      <span className="floating-zoom-text">
        {Math.round(zoom * 100)}%
      </span>
      <div className="floating-button-group">
        <button onClick={onZoomOut} className="floating-control-button" title="Zoom Out"><ZoomOut size={14} /></button>
        <button onClick={onZoomIn} className="floating-control-button" title="Zoom In"><ZoomIn size={14} /></button>
        <button onClick={onResetView} className="floating-control-button" title="Reset View"><RotateCcw size={14} /></button>
      </div>
      {}
      <div className="floating-button-group">
        <button onClick={onUndo} disabled={!canUndo} className="floating-control-button" title="Undo Last Action"><Undo2 size={14} /></button>
        <button onClick={onResetAll} disabled={!canReset} className="floating-control-button" title="Reset All Effects"><XCircle size={14} /></button>
      </div>
    </div>
  );
};

export default FloatingControls;