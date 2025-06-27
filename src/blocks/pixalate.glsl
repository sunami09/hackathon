// { "smartFilterBlockType": "PixalateImage" }

uniform sampler2D input; // main
// { "default": 0.05, "name": "Block Size", "min": 0.001, "max": 0.2 }
uniform float blockSize;

vec4 mainImage(vec2 vUV) { // main
    vec2 gridUV = floor(vUV / blockSize) * blockSize + blockSize * 0.5;
    return texture2D(input, gridUV);
}
