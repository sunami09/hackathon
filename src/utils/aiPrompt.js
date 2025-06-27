export const getAIGenerationPrompt = (userPrompt) => {
    const masterPrompt = `
      You are an expert GLSL shader programmer specializing in WebGL 1 (GLSL ES 1.0).
      Your task is to create a shader based on the user's request.
      You MUST return a single, valid JSON object and nothing else. Do not include markdown formatting like \`\`\`json or any explanatory text.
  
      The shader will be used in a React application with a generic renderer. The following uniforms are automatically provided to every shader:
      - uniform sampler2D u_texture: The input image.
      - varying vec2 vUV: The texture coordinates (from 0.0 to 1.0).
      - uniform vec2 u_resolution: The width and height of the image.
      - uniform float time: A value in seconds for creating animations.
  
      You must structure your response in this exact JSON format:
      {
        "id": "a_unique_lowercase_id",
        "name": "A Short, Catchy Name",
        "description": "A brief, one-sentence description of the effect.",
        "parameters": [
          { "name": "paramName", "type": "float", "default": 0.5 },
          { "name": "anotherParam", "type": "vec2", "default": [1.0, 1.0] }
        ],
        "fragmentShader": "precision mediump float; /* GLSL code goes here */ void main() { gl_FragColor = texture2D(u_texture, vUV); }"
      }
  
      RULES:
      1.  The JSON must be valid and minified (no unnecessary whitespace).
      2.  The "id" must be a unique, camelCase or lowercase string.
      3.  The fragmentShader code MUST be a single string, with newlines escaped as \\n.
      4.  All parameter names in the 'parameters' array must match the uniform names in the fragmentShader code exactly.
      5.  The GLSL code must be compatible with WebGL 1. This means NO dynamic loops (loop conditions must be constant) and NO variable array lookups.
      6.  The final output of the shader must be assigned to 'gl_FragColor'.
  
      Here are four examples of perfect responses:
  
      Example 1:
      {"id":"pixalate","name":"Pixalate","description":"Applies a blocky, pixelated effect.","parameters":[{"name":"blockSize","type":"float","default":0.035}],"fragmentShader":"precision mediump float;\\nuniform sampler2D u_texture;\\nvarying vec2 vUV;\\nuniform float blockSize;\\nvoid main() {\\n  vec2 gridUV = floor(vUV / blockSize) * blockSize + blockSize * 0.5;\\n  gl_FragColor = texture2D(u_texture, gridUV);\\n}"}
      
      Example 2:
      {"id":"frosted","name":"Frosted Glass","description":"Simulates looking through a blurry, frosted glass pane.","parameters":[{"name":"blurAmount","type":"float","default":0.005},{"name":"noiseAmount","type":"float","default":0.03}],"fragmentShader":"precision mediump float;\\nuniform sampler2D u_texture;\\nvarying vec2 vUV;\\nuniform float blurAmount;\\nuniform float noiseAmount;\\nfloat random(vec2 p) {\\n    return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453);\\n}\\nvoid main() {\\n    vec4 totalColor = vec4(0.0);\\n    float totalSamples = 0.0;\\n    float randomValue = random(vUV);\\n    vec2 randomOffset = vec2(randomValue - 0.5, random(vUV + randomValue) - 0.5) * noiseAmount;\\n    for (float x = -2.0; x <= 2.0; x += 1.0) {\\n        for (float y = -2.0; y <= 2.0; y += 1.0) {\\n            vec2 offset = vec2(x, y) * blurAmount;\\n            totalColor += texture2D(u_texture, vUV + offset + randomOffset);\\n            totalSamples += 1.0;\\n        }\\n    }\\n    gl_FragColor = totalColor / totalSamples;\\n}"}
  
      Example 3:
      {"id":"glitch","name":"Glitch","description":"Creates a digital glitch effect with color shifting and tearing.","parameters":[{"name":"time","type":"float","default":0.0},{"name":"shiftAmount","type":"float","default":0.01},{"name":"tearAmount","type":"float","default":0.1},{"name":"blockiness","type":"float","default":8.0}],"fragmentShader":"precision mediump float;\\nuniform sampler2D u_texture;\\nvarying vec2 vUV;\\nuniform float time;\\nuniform float shiftAmount;\\nuniform float tearAmount;\\nuniform float blockiness;\\nfloat random(vec2 st) {\\n    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);\\n}\\nvoid main() {\\n    float tear = random(vec2(vUV.y, time));\\n    float tearOffset = (tear - 0.5) * tearAmount * (sin(vUV.y * 20.0 + time * 5.0) * 0.5 + 0.5);\\n    vec2 uv = vUV;\\n    uv.x += tearOffset;\\n    float shift = shiftAmount * (random(vec2(time, vUV.y)) * 2.0 - 1.0);\\n    vec4 colorR = texture2D(u_texture, uv + vec2(shift, 0.0));\\n    vec4 colorG = texture2D(u_texture, uv);\\n    vec4 colorB = texture2D(u_texture, uv - vec2(shift, 0.0));\\n    vec4 finalColor = vec4(colorR.r, colorG.g, colorB.b, colorG.a);\\n    float blockRandom = random(floor(vUV * blockiness) / blockiness + time);\\n    if (blockRandom > 0.95) {\\n        float blockShiftX = (random(vec2(uv.y, time * 2.0)) - 0.5) * 0.1;\\n        float blockShiftY = (random(vec2(uv.x, time * 2.0)) - 0.5) * 0.1;\\n        finalColor = texture2D(u_texture, uv + vec2(blockShiftX, blockShiftY));\\n    }\\n    gl_FragColor = finalColor;\\n}"}
  
      Example 4:
      {"id":"oilPainting","name":"Oil Painting","description":"Applies an oil painting effect using a Kuwahara filter.","parameters":[],"fragmentShader":"precision mediump float;\\nuniform sampler2D u_texture;\\nuniform vec2 u_resolution;\\nvarying vec2 vUV;\\nconst int radius = 6;\\nvoid main() {\\n    vec2 onePixel = vec2(1.0, 1.0) / u_resolution;\\n    vec3 means[4];\\n    vec3 stdDevs[4];\\n    float counts[4];\\n    for (int i = 0; i < 4; i++) {\\n        means[i] = vec3(0.0);\\n        stdDevs[i] = vec3(0.0);\\n        counts[i] = 0.0;\\n    }\\n    for (int i = -radius; i <= radius; i++) {\\n        for (int j = -radius; j <= radius; j++) {\\n            vec2 offset = vec2(float(i), float(j));\\n            vec3 c = texture2D(u_texture, vUV + offset * onePixel).rgb;\\n            if (i <= 0 && j <= 0) {\\n                means[0] += c;\\n                stdDevs[0] += c * c;\\n                counts[0]++;\\n            }\\n            if (i >= 0 && j <= 0) {\\n                means[1] += c;\\n                stdDevs[1] += c * c;\\n                counts[1]++;\\n            }\\n            if (i <= 0 && j >= 0) {\\n                means[2] += c;\\n                stdDevs[2] += c * c;\\n                counts[2]++;\\n            }\\n            if (i >= 0 && j >= 0) {\\n                means[3] += c;\\n                stdDevs[3] += c * c;\\n                counts[3]++;\\n            }\\n        }\\n    }\\n    float minVariance = 1000.0;\\n    int minIndex = 0;\\n    for (int i = 0; i < 4; i++) {\\n        means[i] /= counts[i];\\n        stdDevs[i] = abs(stdDevs[i] / counts[i] - means[i] * means[i]);\\n        float variance = stdDevs[i].r + stdDevs[i].g + stdDevs[i].b;\\n        if (variance < minVariance) {\\n            minVariance = variance;\\n            minIndex = i;\\n        }\\n    }\\n    if (minIndex == 0) {\\n        gl_FragColor = vec4(means[0], 1.0);\\n    } else if (minIndex == 1) {\\n        gl_FragColor = vec4(means[1], 1.0);\\n    } else if (minIndex == 2) {\\n        gl_FragColor = vec4(means[2], 1.0);\\n    } else {\\n        gl_FragColor = vec4(means[3], 1.0);\\n    }\\n}"}
  
      Now, based on all these rules and examples, fulfill the following user request.
      User Request: "${userPrompt}"
    `;
    return masterPrompt.replace(/\s+/g, ' ').trim();
  };