// src/components/babylon/GLSLRenderer.js

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

    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 vUV;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        vUV = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
      }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const vertices = new Float32Array([
      -1.0, -1.0,  0.0,  0.0,
       1.0, -1.0,  1.0,  0.0,
      -1.0,  1.0,  0.0,  1.0,
       1.0,  1.0,  1.0,  1.0
    ]);

    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }

  createProgram(fragmentShaderSource) {
    const gl = this.gl;

    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 vUV;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        vUV = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
      }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader compile error:', gl.getShaderInfoLog(fragmentShader));
      return null;
    }

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

  async applyFilter(imageSrc, fragmentShaderSource, parameters) {
    const gl = this.gl;

    try {
      const image = await this.loadImage(imageSrc);
      
      this.canvas.width = image.width;
      this.canvas.height = image.height;
      gl.viewport(0, 0, image.width, image.height);

      if (!fragmentShaderSource) {
        throw new Error('A valid fragment shader source must be provided.');
      }

      const program = this.createProgram(fragmentShaderSource);
      if (!program) {
        throw new Error('Failed to create shader program');
      }

      const texture = this.createTexture(image);

      gl.useProgram(program);

      const positionLocation = gl.getAttribLocation(program, 'a_position');
      const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);

      // Automatically pass u_resolution uniform to all shaders
      const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
      if (resolutionLocation !== null) {
          gl.uniform2f(resolutionLocation, image.width, image.height);
      }

      const textureLocation = gl.getUniformLocation(program, 'u_texture');
      gl.uniform1i(textureLocation, 0);

      Object.keys(parameters).forEach(paramName => {
        const location = gl.getUniformLocation(program, paramName);
        if (location !== null) {
          const value = parameters[paramName];
          
          if (typeof value === 'number') {
            gl.uniform1f(location, value);
          } else if (Array.isArray(value) && value.length === 2) {
            gl.uniform2fv(location, value);
          } else if (Array.isArray(value) && value.length === 4) {
            gl.uniform4fv(location, value);
          }
        } else {
          console.warn(`Uniform '${paramName}' not found in shader.`);
        }
      });

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      return this.canvas.toDataURL();

    } catch (error) {
      console.error('Filter application failed:', error);
      throw error;
    }
  }

  dispose() {
    if (this.gl) {
      if (this.vertexBuffer) this.gl.deleteBuffer(this.vertexBuffer);
      if (this.texture) this.gl.deleteTexture(this.texture);
      if (this.program) this.gl.deleteProgram(this.program);
    }
  }
}

export default GLSLRenderer;