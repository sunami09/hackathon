class GLSLRenderer {
    constructor() {
      this.canvas = document.createElement('canvas');
      this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
      
      if (!this.gl) {
        throw new Error('WebGL not supported');
      }
  
      this.program = null;
      this.vertexBuffer = null;
      this.texture = null;
      this.init();
    }
  
    init() {
      const gl = this.gl;
  
      // Vertex shader (standard quad) - Fixed UV coordinates to prevent flipping
      const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 vUV;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          vUV = vec2(a_texCoord.x, 1.0 - a_texCoord.y); // Flip Y to fix upside-down issue
        }
      `;
  
      // Create and compile vertex shader
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);
  
      // Create vertex buffer
      const vertices = new Float32Array([
        -1.0, -1.0, 0.0, 0.0,
         1.0, -1.0, 1.0, 0.0,
        -1.0,  1.0, 0.0, 1.0,
         1.0,  1.0, 1.0, 1.0
      ]);
  
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    }
  
    createProgram(fragmentShaderSource) {
      const gl = this.gl;
  
      // Create fragment shader
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);
  
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Fragment shader compile error:', gl.getShaderInfoLog(fragmentShader));
        return null;
      }
  
      // Get vertex shader
      const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 vUV;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          vUV = vec2(a_texCoord.x, 1.0 - a_texCoord.y); // Flip Y to fix upside-down issue
        }
      `;
  
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);
  
      // Create program
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
  
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
      }
  
      return program;
    }
  
    loadImage(imageSrc) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageSrc;
      });
    }
  
    createTexture(image) {
      const gl = this.gl;
      const texture = gl.createTexture();
      
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      
      return texture;
    }
  
    getFragmentShader(filterId) {
      // For now, hardcode the pixalate shader
      // Later you can load from .glsl files
      const shaders = {
        pixalate: `
          precision mediump float;
          
          uniform sampler2D u_texture;
          uniform float blockSize;
          varying vec2 vUV;
          
          void main() {
            vec2 gridUV = floor(vUV / blockSize) * blockSize + blockSize * 0.5;
            gl_FragColor = texture2D(u_texture, gridUV);
          }
        `
      };
  
      return shaders[filterId] || null;
    }
  
    async applyFilter(imageSrc, filterId, parameters) {
      const gl = this.gl;
  
      try {
        // Load image
        const image = await this.loadImage(imageSrc);
        
        // Set canvas size to match image
        this.canvas.width = image.width;
        this.canvas.height = image.height;
        gl.viewport(0, 0, image.width, image.height);
  
        // Get fragment shader source
        const fragmentShaderSource = this.getFragmentShader(filterId);
        if (!fragmentShaderSource) {
          throw new Error(`Filter '${filterId}' not found`);
        }
  
        // Create program
        const program = this.createProgram(fragmentShaderSource);
        if (!program) {
          throw new Error('Failed to create shader program');
        }
  
        // Create texture
        const texture = this.createTexture(image);
  
        // Use program
        gl.useProgram(program);
  
        // Set up attributes
        const positionLocation = gl.getAttribLocation(program, 'a_position');
        const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
  
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);
  
        // Set uniforms
        const textureLocation = gl.getUniformLocation(program, 'u_texture');
        gl.uniform1i(textureLocation, 0);
  
        // Set filter parameters
        Object.keys(parameters).forEach(paramName => {
          const location = gl.getUniformLocation(program, paramName);
          if (location !== null) {
            gl.uniform1f(location, parameters[paramName]);
          }
        });
  
        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
  
        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  
        // Get result as data URL
        return this.canvas.toDataURL();
  
      } catch (error) {
        console.error('Filter application failed:', error);
        throw error;
      }
    }
  
    dispose() {
      if (this.gl) {
        // Clean up WebGL resources
        if (this.vertexBuffer) {
          this.gl.deleteBuffer(this.vertexBuffer);
        }
        if (this.texture) {
          this.gl.deleteTexture(this.texture);
        }
        if (this.program) {
          this.gl.deleteProgram(this.program);
        }
      }
    }
  }
  
  export default GLSLRenderer;