
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
        { name: 'baseColor', type: 'vec4', default: [0.1, 0.2, 0.3, 1.0] },
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
  

        vec4 getLumOrder(vec3 c0, vec3 c1, vec3 c2, vec3 c3) {
            vec4 lums = vec4(getLumGamma(c0), getLumGamma(c1), getLumGamma(c2), getLumGamma(c3));
            vec4 indices = vec4(0.0, 1.0, 2.0, 3.0);
            float tempLum;
            float tempIdx;
  
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
        id: 'frosted',
        name: 'Frosted Glass',
        description: 'Simulates looking through a blurry, frosted glass pane.',
        parameters: [
            { name: 'blurAmount', type: 'float', default: 0.005 },
            { name: 'noiseAmount', type: 'float', default: 0.03 }
        ],
        fragmentShader: `
            precision mediump float;
            uniform sampler2D u_texture;
            varying vec2 vUV;
    
            uniform float blurAmount;
            uniform float noiseAmount;
    
            float random(vec2 p) {
                return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453);
            }
    
            void main() {
                vec4 totalColor = vec4(0.0);
                float totalSamples = 0.0;
                

                float randomValue = random(vUV);
                vec2 randomOffset = vec2(randomValue - 0.5, random(vUV + randomValue) - 0.5) * noiseAmount;
    
     
                for (float x = -2.0; x <= 2.0; x += 1.0) {
                    for (float y = -2.0; y <= 2.0; y += 1.0) {
                        vec2 offset = vec2(x, y) * blurAmount;
                        totalColor += texture2D(u_texture, vUV + offset + randomOffset);
                        totalSamples += 1.0;
                    }
                }
                
                gl_FragColor = totalColor / totalSamples;
            }
        `
      },
      {
        id: 'glitch',
        name: 'Glitch',
        description: 'Creates a digital glitch effect with color shifting and tearing.',
        parameters: [
          { name: 'time', type: 'float', default: 0.0 },
          { name: 'shiftAmount', type: 'float', default: 0.01 },
          { name: 'tearAmount', type: 'float', default: 0.1 },
          { name: 'blockiness', type: 'float', default: 8.0 }, 
        ],
        fragmentShader: `
          precision mediump float;
          uniform sampler2D u_texture;
          varying vec2 vUV;
          
          uniform float time;
          uniform float shiftAmount;
          uniform float tearAmount;
          uniform float blockiness;
    
          float random(vec2 st) {
              return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
          }
    
          void main() {
              // Horizontal Tearing
              float tear = random(vec2(vUV.y, time));
              float tearOffset = (tear - 0.5) * tearAmount * (sin(vUV.y * 20.0 + time * 5.0) * 0.5 + 0.5);
              vec2 uv = vUV;
              uv.x += tearOffset;
    
              // RGB Channel Splitting
              float shift = shiftAmount * (random(vec2(time, vUV.y)) * 2.0 - 1.0);
              vec4 colorR = texture2D(u_texture, uv + vec2(shift, 0.0));
              vec4 colorG = texture2D(u_texture, uv);
              vec4 colorB = texture2D(u_texture, uv - vec2(shift, 0.0));
              
              vec4 finalColor = vec4(colorR.r, colorG.g, colorB.b, colorG.a);
    
              // Blocky Distortion
              float blockRandom = random(floor(vUV * blockiness) / blockiness + time);
              if (blockRandom > 0.95) {
                  float blockShiftX = (random(vec2(uv.y, time * 2.0)) - 0.5) * 0.1;
                  float blockShiftY = (random(vec2(uv.x, time * 2.0)) - 0.5) * 0.1;
                  finalColor = texture2D(u_texture, uv + vec2(blockShiftX, blockShiftY));
              }
    
              gl_FragColor = finalColor;
          }
        `
    },

    {
        id: 'dither',
        name: 'Dithering',
        description: 'Simulates a retro, 2-color computer screen using a Bayer matrix.',
        parameters: [
          { name: 'scale', type: 'float', default: 1.5 },
        ],
        fragmentShader: `
          precision mediump float;
          uniform sampler2D u_texture;
          varying vec2 vUV;
          
          uniform float scale;
    
          float getLuminance(vec3 color) {
              return dot(color, vec3(0.299, 0.587, 0.114));
          }
    
          void main() {
              mat4 bayerMatrix = mat4(
                  0.0, 8.0, 2.0, 10.0,
                  12.0, 4.0, 14.0, 6.0,
                  3.0, 11.0, 1.0, 9.0,
                  15.0, 7.0, 13.0, 5.0
              ) / 16.0;
    
              vec4 color = texture2D(u_texture, vUV);
              float lum = getLuminance(color.rgb);
              
              int x = int(mod(gl_FragCoord.x / scale, 4.0));
              int y = int(mod(gl_FragCoord.y / scale, 4.0));
              
              float threshold = 0.0;

              if (x == 0) {
                  if (y == 0) threshold = bayerMatrix[0][0];
                  else if (y == 1) threshold = bayerMatrix[0][1];
                  else if (y == 2) threshold = bayerMatrix[0][2];
                  else if (y == 3) threshold = bayerMatrix[0][3];
              } else if (x == 1) {
                  if (y == 0) threshold = bayerMatrix[1][0];
                  else if (y == 1) threshold = bayerMatrix[1][1];
                  else if (y == 2) threshold = bayerMatrix[1][2];
                  else if (y == 3) threshold = bayerMatrix[1][3];
              } else if (x == 2) {
                  if (y == 0) threshold = bayerMatrix[2][0];
                  else if (y == 1) threshold = bayerMatrix[2][1];
                  else if (y == 2) threshold = bayerMatrix[2][2];
                  else if (y == 3) threshold = bayerMatrix[2][3];
              } else if (x == 3) {
                  if (y == 0) threshold = bayerMatrix[3][0];
                  else if (y == 1) threshold = bayerMatrix[3][1];
                  else if (y == 2) threshold = bayerMatrix[3][2];
                  else if (y == 3) threshold = bayerMatrix[3][3];
              }
              
              gl_FragColor = vec4(vec3(step(threshold, lum)), color.a);
          }
        `
    },
    {
        id: 'barrel',
        name: 'Fisheye',
        description: 'Bends the image outwards, like a fisheye lens.',
        parameters: [
            // A value of 1.0 is no distortion. Lower values create a stronger effect.
            { name: 'strength', type: 'float', default: 0.75 } 
        ],
        fragmentShader: `
            precision mediump float;
            uniform sampler2D u_texture;
            varying vec2 vUV;
    
            uniform float strength;
    
            void main() {
                vec2 center = vec2(0.5, 0.5);
                vec2 uv = vUV - center;
                float dist = length(uv);
    
                // If the pixel is outside the circular lens, make it black.
                if (dist >= 0.5) {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                    return;
                }
    
                // Apply the fisheye distortion formula
                float r = length(uv);
                float theta = atan(uv.y, uv.x);
                
                // The 'strength' parameter controls the power of the distortion.
                // pow(r, strength) pulls the inner pixels outwards.
                r = pow(r, strength);
                
                vec2 distortedUV = center + vec2(r * cos(theta), r * sin(theta));
                
                gl_FragColor = texture2D(u_texture, distortedUV);
            }
        `
    },
{
    id: 'oilPainting',
    name: 'Oil Painting',
    description: 'Applies an oil painting effect using a Kuwahara filter.',
    parameters: [], 
    fragmentShader: `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      varying vec2 vUV;

      // Kuwahara radius is hardcoded to 4 for GLSL ES 1.0 compatibility.
      const int radius = 6;

      void main() {
          vec2 onePixel = vec2(1.0, 1.0) / u_resolution;
          
          vec3 means[4];
          vec3 stdDevs[4];
          float counts[4];

          // Initialize arrays
          for (int i = 0; i < 4; i++) {
              means[i] = vec3(0.0);
              stdDevs[i] = vec3(0.0);
              counts[i] = 0.0;
          }

          // Loop with constant bounds
          for (int i = -radius; i <= radius; i++) {
              for (int j = -radius; j <= radius; j++) {
                  vec2 offset = vec2(float(i), float(j));
                  vec3 c = texture2D(u_texture, vUV + offset * onePixel).rgb;
                  
                  if (i <= 0 && j <= 0) {
                      means[0] += c;
                      stdDevs[0] += c * c;
                      counts[0]++;
                  }
                  if (i >= 0 && j <= 0) {
                      means[1] += c;
                      stdDevs[1] += c * c;
                      counts[1]++;
                  }
                  if (i <= 0 && j >= 0) {
                      means[2] += c;
                      stdDevs[2] += c * c;
                      counts[2]++;
                  }
                  if (i >= 0 && j >= 0) {
                      means[3] += c;
                      stdDevs[3] += c * c;
                      counts[3]++;
                  }
              }
          }

          float minVariance = 1000.0;
          int minIndex = 0;
          for (int i = 0; i < 4; i++) {
              means[i] /= counts[i];
              stdDevs[i] = abs(stdDevs[i] / counts[i] - means[i] * means[i]);
              float variance = stdDevs[i].r + stdDevs[i].g + stdDevs[i].b;
              if (variance < minVariance) {
                  minVariance = variance;
                  minIndex = i;
              }
          }
          
          // CORRECTED: Replaced variable array access with unrolled if-statements.
          if (minIndex == 0) {
              gl_FragColor = vec4(means[0], 1.0);
          } else if (minIndex == 1) {
              gl_FragColor = vec4(means[1], 1.0);
          } else if (minIndex == 2) {
              gl_FragColor = vec4(means[2], 1.0);
          } else {
              gl_FragColor = vec4(means[3], 1.0);
          }
      }
    `
},
{
    id: 'celShading',
    name: 'Cel Shading',
    description: 'Creates a cartoonish look with flat colors and outlines.',
    parameters: [
      { name: 'levels', type: 'float', default: 5.0 },
      { name: 'edgeThreshold', type: 'float', default: 0.2 }
    ],
    fragmentShader: `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution; // Automatically provided by the renderer
      varying vec2 vUV;
      
      uniform float levels;
      uniform float edgeThreshold;

      float getLuminance(vec3 color) {
          return dot(color, vec3(0.299, 0.587, 0.114));
      }

      void main() {
          vec2 onePixel = vec2(1.0, 1.0) / u_resolution;
          
          // Sobel edge detection
          float tl = getLuminance(texture2D(u_texture, vUV + onePixel * vec2(-1.0, -1.0)).rgb);
          float t  = getLuminance(texture2D(u_texture, vUV + onePixel * vec2( 0.0, -1.0)).rgb);
          float tr = getLuminance(texture2D(u_texture, vUV + onePixel * vec2( 1.0, -1.0)).rgb);
          float l  = getLuminance(texture2D(u_texture, vUV + onePixel * vec2(-1.0,  0.0)).rgb);
          float r  = getLuminance(texture2D(u_texture, vUV + onePixel * vec2( 1.0,  0.0)).rgb);
          float bl = getLuminance(texture2D(u_texture, vUV + onePixel * vec2(-1.0,  1.0)).rgb);
          float b  = getLuminance(texture2D(u_texture, vUV + onePixel * vec2( 0.0,  1.0)).rgb);
          float br = getLuminance(texture2D(u_texture, vUV + onePixel * vec2( 1.0,  1.0)).rgb);

          float sobelX = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
          float sobelY = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
          float edge = sqrt(sobelX * sobelX + sobelY * sobelY);

          // Color Posterization
          vec4 color = texture2D(u_texture, vUV);
          vec3 posterized = floor(color.rgb * levels) / levels;

          if (edge > edgeThreshold) {
              gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Black outline
          } else {
              gl_FragColor = vec4(posterized, color.a);
          }
      }
    `
},

{
    id: 'crt',
    name: 'CRT Monitor',
    description: 'Simulates an old CRT monitor with scanlines and a bulge.',
    parameters: [
      { name: 'time', type: 'float', default: 0.0 },
      { name: 'bulgeAmount', type: 'float', default: 0.2 },
      { name: 'scanlineDensity', type: 'float', default: 600.0 },
      { name: 'scanlineIntensity', type: 'float', default: 0.15 },
    ],
    fragmentShader: `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      varying vec2 vUV;
      
      uniform float time;
      uniform float bulgeAmount;
      uniform float scanlineDensity;
      uniform float scanlineIntensity;

      void main() {
          vec2 center = vec2(0.5, 0.5);
          vec2 uv = vUV - center;
          float dist = dot(uv, uv);
          vec2 distortedUV = uv * (1.0 - bulgeAmount * dist);
          
          vec4 color = texture2D(u_texture, distortedUV + center);
          
          float scanline = sin(vUV.y * scanlineDensity + time) * scanlineIntensity;
          color.rgb -= scanline;
          
          gl_FragColor = color;
      }
    `
},
{
    id: 'swirl',
    name: 'Swirl',
    description: 'Twists the image around its center.',
    parameters: [
        { name: 'radius', type: 'float', default: 0.5 },
        { name: 'strength', type: 'float', default: 0.4 }
    ],
    fragmentShader: `
      precision mediump float;
      uniform sampler2D u_texture;
      varying vec2 vUV;

      uniform float radius;
      uniform float strength;

      void main() {
          vec2 center = vec2(0.5, 0.5);
          vec2 tc = vUV - center;
          float dist = length(tc);
          
          if (dist < radius) {
              float percent = (radius - dist) / radius;
              float theta = percent * percent * strength * 8.0;
              float s = sin(theta);
              float c = cos(theta);
              tc = vec2(dot(tc, vec2(c, -s)), dot(tc, vec2(s, c)));
          }
          
          tc += center;
          gl_FragColor = texture2D(u_texture, tc);
      }
    `
},
{
    id: 'ripple',
    name: 'Ripple',
    description: 'Creates an animated water ripple effect.',
    parameters: [
      { name: 'time', type: 'float', default: 0.0 },
      { name: 'frequency', type: 'float', default: 20.0 },
      { name: 'amplitude', type: 'float', default: 0.01 },
    ],
    fragmentShader: `
      precision mediump float;
      uniform sampler2D u_texture;
      varying vec2 vUV;
      
      uniform float time;
      uniform float frequency;
      uniform float amplitude;

      void main() {
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(vUV, center);
          
          vec2 distortedUV = vUV;
          distortedUV += sin(dist * frequency - time * 5.0) * amplitude;
          
          gl_FragColor = texture2D(u_texture, distortedUV);
      }
    `
},
{
    id: 'heatHaze',
    name: 'Heat Haze',
    description: 'Simulates rising heat waves.',
    parameters: [
      { name: 'time', type: 'float', default: 0.0 },
      { name: 'speed', type: 'float', default: 1.0 },
      { name: 'magnitude', type: 'float', default: 0.05 },
    ],
    fragmentShader: `
      precision mediump float;
      uniform sampler2D u_texture;
      varying vec2 vUV;
      
      uniform float time;
      uniform float speed;
      uniform float magnitude;

      void main() {
          vec2 uv = vUV;
          float haze = sin(uv.y * 20.0 + time * speed) * magnitude;
          uv.x += haze;
          
          gl_FragColor = texture2D(u_texture, uv);
      }
    `
},
{
    id: 'refraction',
    name: 'Refraction',
    description: 'Simulates a glass lens refracting the image.',
    parameters: [
      { name: 'eta', type: 'float', default: 0.7 }, 
      { name: 'scale', type: 'float', default: 0.4 }, 
    ],
    fragmentShader: `
      precision mediump float;
      uniform sampler2D u_texture;
      varying vec2 vUV;

      uniform float eta;
      uniform float scale;
      
      void main() {
          vec2 center = vec2(0.5, 0.5);
          vec2 p = vUV - center;
          float dist = length(p);

          // If the pixel is outside the circular lens, make it black.
          if (dist > 0.5) {
              gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
              return;
          }

          // Simulate a hemispherical lens to get a normal vector
          float z = sqrt(0.25 - dist * dist);
          vec3 normal = vec3(p, z);
          
          // The view vector is straight-on
          vec3 view = vec3(0.0, 0.0, -1.0);
          
          // Use the built-in GLSL refract function
          vec3 refracted = refract(view, normal, eta);
          
          // Use the refracted vector to distort the texture coordinates
          vec2 distortedUV = vUV + refracted.xy * scale;

          gl_FragColor = texture2D(u_texture, distortedUV);
      }
    `
},
{
    id: 'dotScreen',
    name: 'Dot Screen',
    description: 'Mimics a halftone printing effect with dots.',
    parameters: [
      { name: 'scale', type: 'float', default: 22.0 },
      { name: 'angle', type: 'float', default: 20.0 },
    ],
    fragmentShader: `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution; // <-- THIS LINE WAS MISSING
      varying vec2 vUV;
      
      uniform float scale;
      uniform float angle;

      float getLuminance(vec3 color) {
          return dot(color, vec3(0.299, 0.587, 0.114));
      }

      void main() {
          vec2 center = vec2(0.5, 0.5);
          vec2 uv = vUV - center;
          
          float s = sin(angle);
          float c = cos(angle);
          mat2 rotationMatrix = mat2(c, -s, s, c);
          
          vec2 rotatedUV = rotationMatrix * uv;
          
          float k = 10.0 * scale;
          rotatedUV.x *= u_resolution.x / u_resolution.y;
          
          vec2 samplePos = rotatedUV * k;
          vec2 gridPos = fract(samplePos) - 0.5;
          
          float gridSize = length(gridPos);
          
          vec4 color = texture2D(u_texture, vUV);
          float lum = getLuminance(color.rgb);
          
          float dotSize = (1.0 - lum) * 0.9 + 0.1;
          float a = smoothstep(gridSize - 0.1, gridSize + 0.1, dotSize * 0.5);
          
          gl_FragColor = vec4(vec3(a), color.a);
      }
    `
},
{
    id: 'burntEdges',
    name: 'Burnt Edges',
    description: 'Creates a realistic, layered burnt edge effect with glowing embers.',
    parameters: [
        { name: 'time', type: 'float', default: 0.0 },
        { name: 'radius', type: 'float', default: 0.8 }, 
        { name: 'jaggedness', type: 'float', default: 0.4 } 
    ],
    fragmentShader: `
      precision mediump float;
      uniform sampler2D u_texture;
      varying vec2 vUV;
      uniform float time;

      uniform float radius;
      uniform float jaggedness;

      // Noise functions to create organic patterns
      float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }

      float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      // Fractional Brownian Motion (FBM) for detailed noise
      float fbm(vec2 st) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 2.0;
          for (int i = 0; i < 4; i++) {
              value += amplitude * noise(st * frequency);
              frequency *= 2.0;
              amplitude *= 0.5;
          }
          return value;
      }

      void main() {
          vec2 center = vec2(0.5);
          float dist = distance(vUV, center);
          
          // Combine multiple layers of noise for a detailed, organic edge
          float fbm_noise = fbm(vUV * 8.0 + time * 0.05) * jaggedness;
          
          // Calculate the final distance for the burn effect
          float burn_dist = dist + fbm_noise;

          // Define the different layers of the burn
          float glow_end = radius * 0.7;
          float glow_start = glow_end - 0.03; // A thin line for the glow
          float char_end = glow_end + 0.05;    // A thicker band for the char
          
          // Calculate smooth transitions between layers
          float glow_factor = smoothstep(glow_start, glow_end, burn_dist) - smoothstep(glow_end, char_end, burn_dist);
          float char_factor = smoothstep(glow_end, char_end, burn_dist);
          
          // Get the original pixel color
          vec4 original_color = texture2D(u_texture, vUV);
          vec3 final_color = original_color.rgb;

          // Define colors for the effect
          vec3 glow_color = vec3(1.0, 0.6, 0.1) * 2.0; // Emissive orange for embers
          vec3 char_color = vec3(0.1, 0.05, 0.02);   // Dark, sooty brown for char

          // Mix the colors layer by layer
          final_color = mix(final_color, glow_color, glow_factor);
          final_color = mix(final_color, char_color, char_factor);

          // Create a hard cutoff for the outer edge to make it transparent
          float alpha = 1.0 - smoothstep(char_end, char_end + 0.01, burn_dist);

          gl_FragColor = vec4(final_color, alpha);
      }
    `
}
    ];