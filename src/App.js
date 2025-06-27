import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ImageViewer from './components/ImageViewer';
import { applyCssFiltersToImage } from './utils/canvasUtils';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [effects, setEffects] = useState({
    brightness: 0, contrast: 0, saturation: 0, hue: 0, filters: []
  });
  const [zoom, setZoom] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState([]);

  const [notification, setNotification] = useState('');

  const displayImage = processedImage || selectedImage;

  const handleShowNotification = (message) => {
    setNotification(message);
  };

  const handleClearNotification = () => {
    setNotification('');
  };

  const handleImageUpload = (imageData) => {
    setSelectedImage(imageData);
    setProcessedImage(null);
    setHistory([]);
    setEffects({ brightness: 0, contrast: 0, saturation: 0, hue: 0, filters: [] });
    setAppliedFilters([]);
    setZoom(1);
  };

  const handleDestructiveChange = (newImageData, filterId) => {
    if (displayImage) {
      setHistory(prevHistory => [...prevHistory, displayImage]);
    }
    setProcessedImage(newImageData);
    if (filterId) {
      setAppliedFilters(prev => [...prev, filterId]);
    }
    setEffects({ brightness: 0, contrast: 0, saturation: 0, hue: 0, filters: [] });
  };
  
  const handleUndo = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const lastImage = newHistory.pop();
    setProcessedImage(lastImage === selectedImage ? null : lastImage);
    setHistory(newHistory);
    setAppliedFilters(prev => prev.slice(0, -1));
    setEffects({ brightness: 0, contrast: 0, saturation: 0, hue: 0, filters: [] });
  };

  const handleReset = () => {
    setProcessedImage(null);
    setHistory([]);
    setAppliedFilters([]);
    setEffects({ brightness: 0, contrast: 0, saturation: 0, hue: 0, filters: [] });
  };

  const handleEffectChange = async (effectType, value) => {
    if (effectType !== 'filters') {
      setEffects(prev => ({ ...prev, [effectType]: value }));
    } else {
      const newFilters = effects.filters.includes(value)
        ? effects.filters.filter(f => f !== value)
        : [...effects.filters, value];
      
      const newImageData = await applyCssFiltersToImage(displayImage, { filters: newFilters });
      handleDestructiveChange(newImageData, `css-filter-${Date.now()}`);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="app-container">
      <Sidebar 
        onImageUpload={handleImageUpload}
        effects={effects}
        onEffectChange={handleEffectChange}
        hasImage={!!selectedImage}
        currentImage={displayImage}
        onDestructiveChange={handleDestructiveChange}
        appliedFilters={appliedFilters}
        onUndo={handleUndo}
        onShowNotification={handleShowNotification}
      />
      <ImageViewer 
        image={displayImage}
        effects={effects}
        zoom={zoom}
        onZoomChange={setZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetZoom}
        onUndo={handleUndo}
        onResetAll={handleReset}
        canUndo={history.length > 0}
        canReset={!!processedImage}
        notification={notification}
        onClearNotification={handleClearNotification}
      />
    </div>
  );
}

export default App;