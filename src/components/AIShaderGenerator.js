import React, { useState } from 'react';
import { Sparkles, Wand2, Loader } from 'lucide-react';

const AIShaderGenerator = ({ onGenerateAndApply, isProcessing }) => {
  const [prompt, setPrompt] = useState('');

  const handleGenerate = () => {
    if (!prompt || isProcessing) return;
    onGenerateAndApply(prompt);
  };

  return (
    <div className="effect-panel">
      <div className="effect-header">
        <Sparkles size={16} className="effect-icon" />
        <span className="effect-label">AI Shader Generator</span>
      </div>
      <div className="ai-shader-controls">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'a watery, shimmering reflection'"
          className="ai-shader-textarea"
          rows={3}
          disabled={isProcessing}
        />
        <button
          onClick={handleGenerate}
          disabled={isProcessing || !prompt}
          className="ai-shader-button"
        >
          {isProcessing ? (
            <Loader size={14} className="animate-spin" />
          ) : (
            <Wand2 size={14} />
          )}
          <span>{isProcessing ? 'Generating...' : 'Generate & Apply'}</span>
        </button>
      </div>
    </div>
  );
};

export default AIShaderGenerator;
