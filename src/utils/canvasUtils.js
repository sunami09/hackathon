// src/utils/canvasUtils.js

function getCssFilterString(effects) {
    if (!effects || !effects.filters || effects.filters.length === 0) {
      return 'none';
    }
    const filterParts = [];
    if (effects.filters.includes('blur')) filterParts.push('blur(2px)');
    if (effects.filters.includes('grayscale')) filterParts.push('grayscale(100%)');
    if (effects.filters.includes('sepia')) filterParts.push('sepia(100%)');
    if (effects.filters.includes('invert')) filterParts.push('invert(100%)');
    return filterParts.join(' ');
}
  
export const applyCssFiltersToImage = (imageSrc, effects) => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.filter = getCssFilterString(effects);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL());
        };

        img.onerror = (err) => {
            reject(err);
        };
        
        img.src = imageSrc;
    });
};