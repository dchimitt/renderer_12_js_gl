import { Scene, Camera, Position, Matrix, Model, Vertex, Vector } from "../../../renderer/scene/SceneExport.js";
import { createShader, createProgram, resizeCanvasToMatchDisplay } from "../../../renderer/pipeline/Daniel_GL_util.js";

const vertexShaderSource = `#version 300 es

in vec4 a_position;
in vec4 a_color;
out vec4 v_color;
uniform mat4 u_matrix;
void main() {
    gl_Position = u_matrix * a_position;
    v_color = a_color;
}
`;

const fragmentShaderSource = `#version 300 es

precision highp float;
in vec4 v_color;
out vec4 fragColor;
void main() {
    fragColor = v_color;
}
`;

function main() {
    const canvas = document.getElementById("webgl-canvas");
    const gl = canvas.getContext("webgl2");

    if (!gl) {
        console.error("WebGL 2 not supported in this browser!");
        return;
    }

    // console.log(canvas);
    resizeCanvasToMatchDisplay(canvas, gl);

    // Create shaders and link them into a program (a .exe that WebGL can run)
    const vertexShader = createShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    // Look up locations of attributes and uniforms
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const colorLocation = gl.getAttribLocation(program, "a_color");
    const matrixLocation = gl.getUniformLocation(program, "u_matrix");

    // Rectangle model vertices
    const vertices = new Float32Array(
    [
        -0.5, -0.5, 0.0, // v0 -- bottom left
         0.5, -0.5, 0.0, // v1 -- bottom right
         0.5,  0.5, 0.0, // v2 -- top right
        -0.5,  0.5, 0.0, // v3 -- top left
    ]);

    // Determine edges to draw with gl.LINES
    const edges = new Uint16Array(
    [
        0, 1,  // bottom edge
        1, 2,  // right edge
        2, 3,  // top edge
        3, 0   // left edge
    ]);

    // Colors to help distinguish/debug edges
    const colors = new Float32Array(
    [
        1.0, 0.0, 0.0,  // v0 -- red
        0.0, 1.0, 0.0,  // v1 -- green
        0.0, 0.0, 1.0,  // v2 -- blue
        1.0, 1.0, 1.0   // v3 -- white
    ]);

    // Create buffer for the rectangle vertices
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Create buffer for the rectangle edges
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);

    // Create buffer for the rectangle colors
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    // Create a scene and get its camera
    const scene = new Scene();
    const camera = scene.getCamera();

    // The view matrix moves the objects in scene to simulate the camera position changing, altering what a viewer is currently able to see
    const viewMatrix = camera.getViewMatrix();

    // All rendering in WebGL is done in 3D space, even to render a 2D object such as a rectangle
    // Using orthographic here with his custom matrix library works well since a rectangle is 2D object and does not need depth
    // Default constructor: 
    // projOrtho(left = -1, right = 1, bottom = -1, top = 1, near = -1, viewMat = Matrix.identity()) --> NO FAR?
    camera.projOrtho(-1, 1, -1, 1, 1); 

    const left = camera.left;
    const right = camera.right;
    const bottom = camera.bottom;
    const top = camera.top;
    const near = camera.n;
    const far = 100;

    /* NOTE: DID NOT SEE A .getProjectionMatrix() method so had to manually calculate
       The projection matrix is used to convert world-space coords into clip-space coords for WebGL
       Obtain each column of the orthographic projection matrix (in column-major form)

       In his method, camera.n is negated with -1 (why?)

       FORMULA:
       https://www.scratchapixel.com/lessons/3d-basic-rendering/perspective-and-orthographic-projection-matrix/orthographic-projection-matrix.html

       CURRENTLY, obtain same image regardless of formula used
    */

    const c1 = new Vector(2 / (right - left) ,                  0 ,                 0 , -(right + left) / (right - left));
    const c2 = new Vector(                 0 , 2 / (top - bottom) ,                 0 , -(top + bottom) / (top - bottom));
    const c3 = new Vector(                 0 ,                  0 , -2 / (far - near) ,     -(far + near) / (far - near));
    const c4 = new Vector(                 0 ,                  0 ,                 0 ,                                1);

    /*
    const c1 = new Vector(2 / (right - left) ,                  0 ,               0 , -(right + left) / (right - left));
    const c2 = new Vector(                 0 , 2 / (top - bottom) ,               0 , -(top + bottom) / (top - bottom));
    const c3 = new Vector(                 0 ,                  0 , -2 / (near - 1) ,         -(near + 1) / (near - 1));
    const c4 = new Vector(                 0 ,                  0 ,               0 ,                                1);
    */

    const projectionMatrix = Matrix.buildFromColumns(c1, c2, c3, c4);

    // Translates rectangle from center ( (0,0) in clip-space) )
    const translationMatrix = Matrix.translate(0, -0.5, 0); 

    // Obtain the final matrix we will pass to WebGL
    const modelViewProjectionMatrix = translationMatrix.mult(viewMatrix).mult(projectionMatrix);

    // Convert our custom-built matrix into WebGL-compatible matrix
    const matrixToPass = new Float32Array(
    [
        modelViewProjectionMatrix.v1.x, modelViewProjectionMatrix.v1.y, modelViewProjectionMatrix.v1.z, modelViewProjectionMatrix.v1.w,
        modelViewProjectionMatrix.v2.x, modelViewProjectionMatrix.v2.y, modelViewProjectionMatrix.v2.z, modelViewProjectionMatrix.v2.w,
        modelViewProjectionMatrix.v3.x, modelViewProjectionMatrix.v3.y, modelViewProjectionMatrix.v3.z, modelViewProjectionMatrix.v3.w,
        modelViewProjectionMatrix.v4.x, modelViewProjectionMatrix.v4.y, modelViewProjectionMatrix.v4.z, modelViewProjectionMatrix.v4.w
    ]);

    // console.log(matrixToPass);

    // Bind the vertex positions
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    // Bind the color data
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);

    // This function sends our matrix to the shaders
    gl.uniformMatrix4fv(matrixLocation, false, matrixToPass);

    // Make the canvas element black to distinguish from rest of browser
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the rectangle as a wireframe object using gl.LINES (vs. gl.TRIANGLES, which would require different "edges")
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.LINES, edges.length, gl.UNSIGNED_SHORT, 0);
}

main();
