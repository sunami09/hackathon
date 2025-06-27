import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ImageViewer from './components/ImageViewer';
import { applyCssFiltersToImage } from './utils/canvasUtils';
import { getAIGenerationPrompt } from './utils/aiPrompt';
import GLSLRenderer from './components/babylon/GLSLRenderer';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [effects, setEffects] = useState({
    brightness: 0, contrast: 0, saturation: 0, hue: 0, filters: []
  });
  const [zoom, setZoom] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState([]);
  
  const [glslRenderer, setGlslRenderer] = useState(null);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  
  const [trainingData, setTrainingData] = useState([]);

  useEffect(() => {
    setGlslRenderer(new GLSLRenderer());
  }, []);

  const displayImage = processedImage || selectedImage;

  const handleImageUpload = (imageData) => {
    setSelectedImage(imageData);
    setProcessedImage(null);
    setHistory([]);
    setEffects({ brightness: 0, contrast: 0, saturation: 0, hue: 0, filters: [] });
    setAppliedFilters([]);
    setTrainingData([]);
    setZoom(1);
  };

  const handleDestructiveChange = (newImageData, shaderObject) => {
    if (displayImage) {
      setHistory(prevHistory => [...prevHistory, displayImage]);
    }
    setProcessedImage(newImageData);
    if (shaderObject) {
      setAppliedFilters(prev => [...prev, shaderObject]);
    }
    setEffects({ brightness: 0, contrast: 0, saturation: 0, hue: 0, filters: [] });
  };
  
  const handleUndo = () => {
    if (history.length === 0) return;

    const lastAppliedFilter = appliedFilters[appliedFilters.length - 1];
    if (lastAppliedFilter && lastAppliedFilter.prompt) {
        setTrainingData(prev => prev.slice(0, -1));
    }

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
    setTrainingData([]);
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
      handleDestructiveChange(newImageData, { id: `css-filter-${Date.now()}` });
    }
  };

  const handleGenerateAndApplyAIShader = async (userPrompt) => {
    if (!glslRenderer || !displayImage) {
      window.alert("Please upload an image first.");
      return;
    }

    setIsAIGenerating(true);
    try {
      const fullPrompt = getAIGenerationPrompt(userPrompt);
      
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      const apiUrl = 'https://api.openai.com/v1/chat/completions';

      const payload = {
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: "You are an expert GLSL shader programmer. Your task is to return a single, valid JSON object based on the user's request. Do not include any markdown or explanatory text."
            },
            {
                role: "user",
                content: fullPrompt
            }
        ],
        temperature: 0.1, 
        max_tokens: 2048,
        response_format: { "type": "json_object" }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      const rawText = result.choices[0].message.content;
      console.log(rawText)
      
  
      const trainingDataObject = { userInput: userPrompt, gptResponse: rawText };
      setTrainingData(prev => [...prev, trainingDataObject]);

      let shaderObject;
      try {
       
        shaderObject = JSON.parse(rawText);
      } catch (e) {
        console.error("Failed to parse JSON from AI response:", e);
        console.error("Raw AI response:", rawText);
        throw new Error("AI returned invalid JSON. Please try again.");
      }
      
      const finalShaderObject = {
          ...shaderObject,
          prompt: userPrompt,
          id: `ai-${shaderObject.id}-${Date.now()}`
      };

      const parameters = {};
      if (finalShaderObject.parameters) {
        finalShaderObject.parameters.forEach(param => {
          parameters[param.name] = param.default;
        });
      }
      if (parameters.hasOwnProperty('time')) {
          parameters.time = (Date.now() / 1000.0) % 3600;
      }
      
      const newImageData = await glslRenderer.applyFilter(displayImage, finalShaderObject.fragmentShader, parameters);
      
      handleDestructiveChange(newImageData, finalShaderObject);

    } catch (error) {
      console.error("AI Shader Generation Failed:", error);
      window.alert(`An error occurred: ${error.message}`);
    } finally {
      setIsAIGenerating(false);
    }
  };

  const handleDownloadTrainingData = () => {
      if (trainingData.length === 0) {
          alert("You haven't generated any AI shaders to download yet.");
          return;
      }
      const jsonString = JSON.stringify(trainingData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Data.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
        onGenerateAndApplyAIShader={handleGenerateAndApplyAIShader}
        isAIGenerating={isAIGenerating}
        trainingData={trainingData}
        onDownloadTrainingData={handleDownloadTrainingData}
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
      />
    </div>
  );
}

export default App;
