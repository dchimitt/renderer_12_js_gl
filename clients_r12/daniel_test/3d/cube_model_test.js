import { Scene, Camera, Position, Matrix, Model, Vertex, Vector } from "../../../renderer/scene/SceneExport.js";
import { createShader, createProgram, resizeCanvasToMatchDisplay } from "../../../renderer/pipeline/Daniel_GL_util.js";
import Cube from "../../../renderer/models_L/Cube.js";

const vertexShaderSource = `#version 300 es

in vec4 a_position;
uniform mat4 u_matrix;

void main() {
    gl_Position = u_matrix * a_position;
}
`;

const fragmentShaderSource = `#version 300 es

precision highp float;
out vec4 fragColor;
uniform vec4 u_color;

void main() {
    fragColor = u_color;
}
`;

function main() {
    const canvas = document.getElementById("webgl-canvas");
    const gl = canvas.getContext("webgl2");

    if (!gl) {
        console.error("WebGL 2 not supported by this browser!");
        return;
    }

    resizeCanvasToMatchDisplay(canvas, gl);

    const vertexShader = createShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    // Get attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const matrixLocation = gl.getUniformLocation(program, "u_matrix");
    const colorLocation = gl.getUniformLocation(program, "u_color");

    // Set up camera in perspective projection mode
    let camera = new Camera(-1, 1, -1, 1, -1, true, Matrix.identity());

    // Create cube models
    let cubeModel1 = new Cube();
    let cubeModel2 = new Cube();

    // Create transformation matrices for each cube
    // Currently, both models are translated together. However, rotation is applied to only model 2
    let cubeModelMatrix1 = Matrix.translate(1, 0.5, 3); 
    let cubeModelMatrix2 = Matrix.rotateZ(45); 

    // Create two position objects with the cube models and their transformation matrices
    let p1 = new Position(cubeModel1, cubeModelMatrix1); 
    let p2 = new Position(cubeModel2, cubeModelMatrix2); 

    // Create a list of positions and then call the scene constructor with that list
    let positionList = [p1, p2];
    let scene = new Scene(camera, positionList);
    console.log(scene);

    // Get the vertices for cube1 and cube2, and then convert them into a flat array
    let cubeVertices1 = cubeModel1.getVertexList(); 
    let cubeVertices2 = cubeModel2.getVertexList(); 
    let cubeVerticesFlat1 = flattenVertices(cubeVertices1);
    let cubeVerticesFlat2 = flattenVertices(cubeVertices2);

    // Define the cube's edges and then get a flat array of the index pairs (need this to tell WebGL which lines to draw)
    // Would be different if drawing with triangle primitives
    let cubeEdges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // bottom face lines
        [4, 5], [5, 6], [6, 7], [7, 4], // top face lines
        [0, 4], [1, 5], [2, 6], [3, 7]  // vertical lines
    ];
    let cubeEdgeIndices = [];
    for (let i = 0; i < cubeEdges.length; i++) {
        cubeEdgeIndices.push(cubeEdges[i][0], cubeEdges[i][1]);
    }

    // Clear canvas and set black background color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST); // Enable depth-testing for 3D rendering (currently does nothing)

    // Create VAO (WebGL2 specific, reduces redundancy)
    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Create WebGL-compatible buffer for the vertex positions of both cubes
    let positionBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer1);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVerticesFlat1), gl.STATIC_DRAW);
    let positionBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVerticesFlat2), gl.STATIC_DRAW);

    // Bind the index buffer for drawing the cube edges
    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeEdgeIndices), gl.STATIC_DRAW);

    // Set up the position attribute for the cube vertices
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    // Set up the perspective projection matrix
    // Note: I defined a new variable, far, as current camera module uses an infinite far distance
    let left = camera.left;
    let right = camera.right;
    let bottom = camera.bottom;
    let top = camera.top;
    let near = camera.n; 
    let far = 1000; 

    /*
        gl-matrix definition:
        https://glmatrix.net/docs/mat4.js.html#line1508

        Formula:
        https://www.scratchapixel.com/lessons/3d-basic-rendering/perspective-and-orthographic-projection-matrix/opengl-perspective-projection-matrix.html

        I multiplied c1 times negative 1 so that translations in x direction are not reversed
    */
    let c1 = new Vector(-2 * near / (right - left) ,                         0 , (right + left) / (right - left) ,                              0);
    let c2 = new Vector(                         0 , 2 * near / (top - bottom) , (top + bottom) / (top - bottom) ,                              0);
    let c3 = new Vector(                         0 ,                         0 ,    -(far + near) / (far - near) , -2 * far * near / (far - near));
    let c4 = new Vector(                         0 ,                         0 ,                              -1 ,                              0);
    let projectionMatrix = Matrix.buildFromColumns(c1, c2, c3, c4);
    console.log("projectionMatrix: ", projectionMatrix);

    // Loop through each position in the scene and render through WebGL
    for (let position of scene.getPositionList()) {
        // Get the model matrix at the current position
        let modelMatrix = position.getMatrix();
        console.log("Current modelMatrix: " + modelMatrix);

        // Get the camera's view matrix (this could change dynamically, so find this inside render loop as well)
        let viewMatrix = camera.getViewMatrix();
        console.log("Current viewMatrix: " + modelMatrix);

        // Calculate the model-view-projection (MVP) matrix for this position
        let modelViewProjectionMatrix = projectionMatrix.mult(viewMatrix).mult(modelMatrix);
        console.log("Current MVP: " + modelViewProjectionMatrix);

        // Convert the MVP matrix to WebGL-compatible form
        let finalMatrixToPass = convertMatrixToFloat32Array(modelViewProjectionMatrix); 

        // Send the MVP to the shader functions
        gl.uniformMatrix4fv(matrixLocation, false, finalMatrixToPass); 

        if (position === p1) {
            gl.uniform4f(colorLocation, 1.0, 0.0, 0.0, 1.0);  // Red
        } 
        else if (position === p2) {
            gl.uniform4f(colorLocation, 0.0, 0.0, 1.0, 1.0);  // Blue
        }

        // Draw the current model using lines
        gl.drawElements(gl.LINES, cubeEdgeIndices.length, gl.UNSIGNED_SHORT, 0);
    }
}

// Convert the vertices of a 3D object into a flat array
function flattenVertices(vertices) {
    let flatArray = [];
    for (let vertex of vertices) {
        flatArray.push(vertex.x, vertex.y, vertex.z);
    }
    return flatArray;
}

// Convert a 4x4 matrix to a Float32Array for WebGL
function convertMatrixToFloat32Array(matrix) {
    let finalMatrixToPass = new Float32Array(16);
    let currentIndex = 0;

    finalMatrixToPass[currentIndex] = matrix.v1.x; currentIndex++;
    finalMatrixToPass[currentIndex] = matrix.v1.y; currentIndex++;
    finalMatrixToPass[currentIndex] = matrix.v1.z; currentIndex++;
    finalMatrixToPass[currentIndex] = matrix.v1.w; currentIndex++;

    finalMatrixToPass[currentIndex] = matrix.v2.x; currentIndex++;
    finalMatrixToPass[currentIndex] = matrix.v2.y; currentIndex++;
    finalMatrixToPass[currentIndex] = matrix.v2.z; currentIndex++;
    finalMatrixToPass[currentIndex] = matrix.v2.w; currentIndex++;

    finalMatrixToPass[currentIndex] = matrix.v3.x; currentIndex++;
    finalMatrixToPass[currentIndex] = matrix.v3.y; currentIndex++;
    finalMatrixToPass[currentIndex] = matrix.v3.z; currentIndex++;
    finalMatrixToPass[currentIndex] = matrix.v3.w; currentIndex++;

    finalMatrixToPass[currentIndex] = matrix.v4.x; currentIndex++;
    finalMatrixToPass[currentIndex] = matrix.v4.y; currentIndex++;
    finalMatrixToPass[currentIndex] = matrix.v4.z; currentIndex++;
    finalMatrixToPass[currentIndex] = matrix.v4.w; currentIndex++;

    return finalMatrixToPass;
}

main();
