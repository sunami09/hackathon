import React from 'react';
import { Upload } from 'lucide-react';

const ImageUpload = ({ onImageUpload }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageUpload(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="upload-section">
      <h2>Upload Image</h2>
      <label className="upload-area">
        <div className="upload-content">
          <Upload className="upload-icon" size={32} color="#9ca3af" />
          <p className="upload-text">Click to upload image</p>
          <p className="upload-subtext">PNG, JPG, GIF up to 10MB</p>
        </div>
        <input 
          type="file" 
          className="upload-input" 
          accept="image/*"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default ImageUpload;