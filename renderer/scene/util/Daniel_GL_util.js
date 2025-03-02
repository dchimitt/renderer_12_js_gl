/*
  These helper function definitions were obtained on the web from:
  https://webgl2fundamentals.org/webgl/resources/webgl-utils.js
*/

/**
 * Creates and compiles a shader.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} shaderSource The GLSL source code for the shader.
 * @param {number} shaderType The type of shader, VERTEX_SHADER or
 *     FRAGMENT_SHADER.
 * @return {!WebGLShader} The shader.
 */
export function createShader(gl, shaderSource, shaderType) {
  // Create the shader object
  var shader = gl.createShader(shaderType);
   
  // Set the shader source code.
  gl.shaderSource(shader, shaderSource);
   
  // Compile the shader
  gl.compileShader(shader);
   
  // Check if it compiled
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    // Something went wrong during compilation; get the error
    throw ("Shader compile error: " + gl.getShaderInfoLog(shader));
  }
   
  return shader;
}
  
/**
* Creates a program from 2 shaders.
*
* @param {!WebGLRenderingContext) gl The WebGL context.
* @param {!WebGLShader} vertexShader A vertex shader.
* @param {!WebGLShader} fragmentShader A fragment shader.
* @return {!WebGLProgram} A program.
*/
export function createProgram(gl, vertexShader, fragmentShader) {
  // create a program.
  var program = gl.createProgram();
  
  // attach the shaders.
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  
  // link the program.
  gl.linkProgram(program);
  
  // Check if it linked.
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    // something went wrong with the link; get the error
    throw ("Program link error: " + gl.getProgramInfoLog(program));
  }
  
  return program;
};

export function resizeCanvasToMatchDisplay(canvas, gl) {
  // Obtains the device pixel ratio to fix blurriness by matching device resolution
  var dpr = window.devicePixelRatio;  
  var displayWidth = canvas.clientWidth * dpr;   
  var displayHeight = canvas.clientHeight * dpr; 

  if (!canvas) {
      console.error("Canvas not found!");
      return;
  }

  // Check if the canvas resolution needs to be updated
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);  // Adjust viewport to the new resolution
  }
}



