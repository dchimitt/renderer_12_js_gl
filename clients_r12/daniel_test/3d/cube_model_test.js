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

void main() {
    fragColor = vec4(1.0, 1.0, 1.0, 1.0); // white
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

    // Set up camera in perspective projection mode
    let camera = new Camera(-1, 1, -1, 1, -1, true, Matrix.identity());
    console.log("camera: ", camera);

    // Create cube models and apply transformations
    let cubeModel = new Cube();
    let cubeModelMatrix1 = Matrix.translate(0, -0.5, 0);
    let cubeModelMatrix2 = Matrix.rotateY(Math.PI / 4); 

    // Create two cube positions with their associated transformation matrix 
    let p1 = new Position(cubeModel, cubeModelMatrix1);
    let p2 = new Position(cubeModel, cubeModelMatrix2); 

    // Create a list of positions and then call the scene constructor with that list
    let positionList = [p1, p2];
    let scene = new Scene(camera, positionList);

    // Convert the list of vertices into a flat array of form [(x1, y1, z1), (x2, y2, z2)...]
    let cubeVertices = cubeModel.getVertexList();
    console.log("cubeVertices", cubeVertices);
    let cubeVerticesFlat = [];
    for (let i = 0; i < cubeVertices.length; i++) {
        cubeVerticesFlat.push(cubeVertices[i].x, cubeVertices[i].y, cubeVertices[i].z);
    }
    console.log("cubeVerticesFlat: ", cubeVerticesFlat);

    // Define the cube's edges and then get a flat array of the index pairs
    let cubeEdges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // bottom face lines
        [4, 5], [5, 6], [6, 7], [7, 4], // top face lines
        [0, 4], [1, 5], [2, 6], [3, 7]  // vertical lines
    ];
    let cubeEdgeIndices = [];
    for (let i = 0; i < cubeEdges.length; i++) {
        cubeEdgeIndices.push(cubeEdges[i][0], cubeEdges[i][1]);
    }
    console.log("cubeEdgeIndices", cubeEdgeIndices);

    // Clear canvas and set black background color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST); // Enable depth-testing (used in 3D rendering) --- currently does nothing?

    // Create VAO (WebGL2 specific, reduces redundancy)
    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Create WebGL-compatiblebuffer for the vertex positions
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVerticesFlat), gl.STATIC_DRAW);

    // Tell the attribute how to get data out of positionLocation and then turn it on
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    // Create WebGL-compatible buffer for the vertex indices
    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeEdgeIndices), gl.STATIC_DRAW);

    // Set up variables to get the camera's perspective projection matrix (did not see method to return this)
    let left = camera.left;
    let right = camera.right;
    let bottom = camera.bottom;
    let top = camera.top;
    let near = camera.n; // adjusting near/far gives different shapes..
    let far = 100; // not in constructor?
    console.log("camera: ", camera);

    /*
        gl-matrix definition:
        https://glmatrix.net/docs/mat4.js.html#line1508

        Formula:
        https://www.scratchapixel.com/lessons/3d-basic-rendering/perspective-and-orthographic-projection-matrix/opengl-perspective-projection-matrix.html

        var m4 = {
            perspective: function(fieldOfViewInRadians, aspect, near, far) {
                var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
                var rangeInv = 1.0 / (near - far);
 
                return [
                    f / aspect, 0, 0, 0,
                    0, f, 0, 0,
                    0, 0, (near + far) * rangeInv, -1,
                    0, 0, near * far * rangeInv * 2, 0
                ];
            },
    */
    let c1 = new Vector(2 * near / (right - left) ,                         0 , (right + left) / (right - left) ,                              0);
    let c2 = new Vector(                        0 , 2 * near / (top - bottom) , (top + bottom) / (top - bottom) ,                              0);
    let c3 = new Vector(                        0 ,                         0 ,    -(far + near) / (far - near) , -2 * far * near / (far - near));
    let c4 = new Vector(                        0 ,                         0 ,                              -1 ,                              0);
    let projectionMatrix = Matrix.buildFromColumns(c1, c2, c3, c4);
    console.log("projectionMatrix: ", projectionMatrix);

    // Loop through each position in the scene and render through WebGL
    for (let position of scene.getPositionList()) {
        // Get the camera's view matrix
        let modelViewMatrix = camera.getViewMatrix();
        console.log("modelViewMatrix: ", modelViewMatrix);

        let positionModelMatrix = position.getMatrix();
        
        // Model transforms from object space to world space
        // View "" "" "" from world space to camera space
        // Projection "" "" "" from camera space to clip space
        let modelViewProjectionMatrix = projectionMatrix.mult(modelViewMatrix).mult(positionModelMatrix);

        // Convert the MVP to WebGL-compatible form
        let finalMatrixToPass = new Float32Array(16);
        let currentIndex = 0;

        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v1.x;  
        currentIndex++
        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v1.y;  
        currentIndex++
        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v1.z;  
        currentIndex++
        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v1.w; 
        currentIndex++

        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v2.x;  
        currentIndex++
        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v2.y; 
        currentIndex++
        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v2.z; 
        currentIndex++
        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v2.w; 
        currentIndex++

        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v3.x;   
        currentIndex++
        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v3.y;  
        currentIndex++
        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v3.z;  
        currentIndex++
        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v3.w;  
        currentIndex++

        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v4.x; 
        currentIndex++
        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v4.y;  
        currentIndex++
        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v4.z;  
        currentIndex++
        finalMatrixToPass[currentIndex] = modelViewProjectionMatrix.v4.w;  

        console.log("finalMatrixToPass: ", finalMatrixToPass);

        gl.uniformMatrix4fv(matrixLocation, false, finalMatrixToPass); // Send the MVP to the shader functions

        gl.drawElements(gl.LINES, cubeEdgeIndices.length, gl.UNSIGNED_SHORT, 0); // Draw models with lines
    }
}

main();