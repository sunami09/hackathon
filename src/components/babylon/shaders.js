// src/components/babylon/shaders.js

export const SHADERS = [
    {
      id: 'pixalate',
      name: 'Pixalate',
      description: 'Applies a blocky, pixelated effect.',
      parameters: [
        {
          name: 'blockSize',
          type: 'float',
          default: 0.035,
        },
      ],
      fragmentShader: `
        precision mediump float;
        uniform sampler2D u_texture;
        varying vec2 vUV;
        
        uniform float blockSize;
        
        void main() {
          vec2 gridUV = floor(vUV / blockSize) * blockSize + blockSize * 0.5;
          gl_FragColor = texture2D(u_texture, gridUV);
        }
      `
    },
    {
      id: 'posterize',
      name: 'Posterize',
      description: 'Reduces the image to a limited number of colors.',
      parameters: [
        { name: 'baseColor', type: 'vec4', default: [0.5, 0.5, 0.5, 1.0] },
        { name: 'levels', type: 'float', default: 4.0 },
        { name: 'matchLuminosity', type: 'bool', default: 1.0 },
        { name: 'mode', type: 'float', default: 1.0 }
      ],
      fragmentShader: `
        precision mediump float;
        
        uniform sampler2D u_texture;
        varying vec2 vUV;
  
        uniform vec4 baseColor;
        uniform float levels;
        uniform bool matchLuminosity;
        uniform float mode;
  
        const float GAMMA = 2.2;
  
        // ... other helper functions like getHslFromColor, etc. remain the same ...
        vec3 getHslFromColor(vec3 color) {
            float r = color.r; float g = color.g; float b = color.b;
            float maxC = max(r, max(g, b)); float minC = min(r, min(g, b));
            float delta = maxC - minC;
            float h, s, l = (maxC + minC) / 2.0;
            if (delta == 0.0) { h = s = 0.0; } else {
                s = l < 0.5 ? delta / (maxC + minC) : delta / (2.0 - maxC - minC);
                if (maxC == r) { h = (g - b) / delta + (g < b ? 6.0 : 0.0); } 
                else if (maxC == g) { h = (b - r) / delta + 2.0; } 
                else { h = (r - g) / delta + 4.0; }
                h /= 6.0;
            }
            return vec3(h, s, l);
        }
  
        float hueToRgbComponent(float p, float q, float t) {
            if (t < 0.0) t += 1.0; if (t > 1.0) t -= 1.0;
            if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
            if (t < 1.0/2.0) return q;
            if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
            return p;
        }
  
        vec3 getColorFromHsl(vec3 hsl) {
            float h = hsl.x; float s = hsl.y; float l = hsl.z;
            if (s == 0.0) { return vec3(l, l, l); }
            float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
            float p = 2.0 * l - q;
            float r = hueToRgbComponent(p, q, h + 1.0/3.0);
            float g = hueToRgbComponent(p, q, h);
            float b = hueToRgbComponent(p, q, h - 1.0/3.0);
            return vec3(r, g, b);
        }
  
        float getLum(vec3 color) { return dot(color, vec3(0.3, 0.59, 0.11)); }
        
        float getLumGamma(vec3 color) {
            vec3 gammaCorrected = pow(color, vec3(1.0 / GAMMA));
            return dot(gammaCorrected, vec3(0.3, 0.59, 0.11));
        }
  
        vec3 clipColor(vec3 color) {
            float l = getLum(color); float n = min(min(color.r, color.g), color.b); float x = max(max(color.r, color.g), color.b);
            if (n < 0.0) { color = l + ((color - l) * l) / (l - n); }
            if (x > 1.0) { color = l + ((color - l) * (1.0 - l)) / (x - l); }
            return color;
        }
  
        vec3 setLum(float luminance, vec3 color) {
          if (luminance == 0.0) return vec3(0.0); if (luminance == 1.0) return vec3(1.0);
          float d = luminance - getLum(color);
          return clipColor(color + d);
        }
  
        vec3 getColorByIndex(float index, vec3 c0, vec3 c1, vec3 c2, vec3 c3) {
            if (index <= 0.0) return c0; if (index <= 1.0) return c1;
            if (index <= 2.0) return c2; if (index <= 3.0) return c3;
            return vec3(0.0);
        }
  
        // CORRECTED: Replaced the non-compliant for-loop with an unrolled sorting network.
        vec4 getLumOrder(vec3 c0, vec3 c1, vec3 c2, vec3 c3) {
            vec4 lums = vec4(getLumGamma(c0), getLumGamma(c1), getLumGamma(c2), getLumGamma(c3));
            vec4 indices = vec4(0.0, 1.0, 2.0, 3.0);
            float tempLum;
            float tempIdx;
  
            // Compare and swap pairs to sort the 4 elements
            if (lums.x > lums.y) {
                tempLum = lums.x; lums.x = lums.y; lums.y = tempLum;
                tempIdx = indices.x; indices.x = indices.y; indices.y = tempIdx;
            }
            if (lums.z > lums.w) {
                tempLum = lums.z; lums.z = lums.w; lums.w = tempLum;
                tempIdx = indices.z; indices.z = indices.w; indices.w = tempIdx;
            }
            if (lums.x > lums.z) {
                tempLum = lums.x; lums.x = lums.z; lums.z = tempLum;
                tempIdx = indices.x; indices.x = indices.z; indices.z = tempIdx;
            }
            if (lums.y > lums.w) {
                tempLum = lums.y; lums.y = lums.w; lums.w = tempLum;
                tempIdx = indices.y; indices.y = indices.w; indices.w = tempIdx;
            }
            if (lums.y > lums.z) {
                tempLum = lums.y; lums.y = lums.z; lums.z = tempLum;
                tempIdx = indices.y; indices.y = indices.z; indices.z = tempIdx;
            }
            
            return indices;
        }
  
        vec3 getColor(float t, vec3 color) {
            int levelCount = int(floor(levels)); 
            if (levelCount <= 1) { return color; }
            float step = 1.0 / float(levelCount);
            int index = int(min(floor(t / step), float(levelCount - 1)));
            
            if (mode == 0.0) {
                if (index == 0) return vec3(0.0); if (index == levelCount - 1) return vec3(1.0);
                return t < 0.5 ? mix(vec3(0.0), color, t * 2.0) : mix(color, vec3(1.0), (t - 0.5) * 2.0);
            }
            vec3 hsl = getHslFromColor(color); vec3 c0 = color; vec3 c1 = vec3(1.0); vec3 c2 = vec3(1.0); vec3 c3 = vec3(1.0);
            if (mode == 1.0) {
                float complementHue = mod(hsl.x + 0.5, 1.0);
                c1 = getColorFromHsl(vec3(complementHue, hsl.y, hsl.z));
                if (levelCount > 2) c2 = getColorFromHsl(vec3(mod(complementHue + 0.0833, 1.0), hsl.y, hsl.z));
                if (levelCount > 3) c3 = getColorFromHsl(vec3(mod(complementHue - 0.0833, 1.0), hsl.y, hsl.z));
            } else if (mode == 2.0) {
                c1 = getColorFromHsl(vec3(mod(hsl.x + 0.3333, 1.0), hsl.y, hsl.z));
                if (levelCount > 2) c2 = getColorFromHsl(vec3(mod(hsl.x - 0.3333, 1.0), hsl.y, hsl.z));
                if (levelCount > 3) c3 = vec3(0.0);
            } else if (mode == 3.0) {
                c1 = getColorFromHsl(vec3(mod(hsl.x + 0.25, 1.0), hsl.y, hsl.z));
                if (levelCount > 2) c2 = getColorFromHsl(vec3(mod(hsl.x - 0.25, 1.0), hsl.y, hsl.z));
                if (levelCount > 3) c3 = getColorFromHsl(vec3(mod(hsl.x + 0.5, 1.0), hsl.y, hsl.z));
            } else { return vec3(0.0); }
            vec4 lumOrder = getLumOrder(c0, c1, c2, c3); vec3 ret = vec3(1.0);
            if (index == 0) ret = getColorByIndex(lumOrder.x, c0, c1, c2, c3);
            else if (index == 1) ret = getColorByIndex(lumOrder.y, c0, c1, c2, c3);
            else if (index == 2) ret = getColorByIndex(lumOrder.z, c0, c1, c2, c3);
            else if (index == 3) ret = getColorByIndex(lumOrder.w, c0, c1, c2, c3);
            if (matchLuminosity && levels > 1.0) { ret = setLum(float(index) / (levels - 1.0), ret); }
            return ret;
        }
        
        vec4 posterize_main() {
            vec4 color = texture2D(u_texture, vUV);
            float luminance = getLum(color.rgb);
            vec3 posterizedColor = getColor(luminance, baseColor.rgb);
            return vec4(posterizedColor, color.a);
        }
  
        void main() {
          gl_FragColor = posterize_main();
        }
      `
    },
    {
      id: 'glass',
      name: 'Glass',
      description: 'Distorts the image as if viewed through shattered glass.',
      parameters: [
          { name: 'tileSize', type: 'float', default: 12.0 },
          { name: 'magnitude', type: 'float', default: 0.05 }
      ],
      fragmentShader: `
          precision mediump float;
          uniform sampler2D u_texture;
          varying vec2 vUV;
          uniform float tileSize;
          uniform float magnitude;
    
          float random(vec2 p) {
              return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }
    
          void main() {
              vec2 p = floor(vUV * tileSize);
              float r = random(p) * magnitude;
              vec2 uv = vUV + r;
              vec4 color = texture2D(u_texture, uv);
              gl_FragColor = color;
          }
      `
    }
  ];