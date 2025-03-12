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

    // Create a single cube model
    let cubeModel = new Cube();

    // Initial transformation to center the cube and put it within near-far Z range
    let cubeModelMatrix = Matrix.translate(0, 0, 3);  

    // Create a position object with the cube model and its transformation matrix
    let p1 = new Position(cubeModel, cubeModelMatrix); 

    // Create a list with just the single position and call the scene constructor with that list
    let positionList = [p1];
    let scene = new Scene(camera, positionList);
    console.log(scene);

    // Get the vertices for the cube, and then convert them into a flat array
    let cubeVertices = cubeModel.getVertexList();
    let cubeVerticesFlat = flattenVertices(cubeVertices);

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

    // Clear canvas and set black background color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST); // Enable depth-testing for 3D rendering (currently does nothing)

    // Create VAO (WebGL2 specific, reduces redundancy)
    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Create WebGL-compatible buffer for the vertex positions of the cube
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVerticesFlat), gl.STATIC_DRAW);

    // Bind the index buffer for drawing the cube edges
    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeEdgeIndices), gl.STATIC_DRAW);

    // Set up the position attribute for the cube vertices
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    // Set up the perspective projection matrix
    let left = camera.left;
    let right = camera.right;
    let bottom = camera.bottom;
    let top = camera.top;
    let near = camera.n;
    let far = 1000;

    let c1 = new Vector(-2 * near / (right - left), 0, (right + left) / (right - left), 0);
    let c2 = new Vector(0, 2 * near / (top - bottom), (top + bottom) / (top - bottom), 0);
    let c3 = new Vector(0, 0, -(far + near) / (far - near), -2 * far * near / (far - near));
    let c4 = new Vector(0, 0, -1, 0);
    let projectionMatrix = Matrix.buildFromColumns(c1, c2, c3, c4);
    console.log("projectionMatrix: ", projectionMatrix);

    // Loop through the single position in the scene and render through WebGL
    for (let position of scene.getPositionList()) {
        // Get the model matrix at the current position
        let modelMatrix = position.getMatrix();
        console.log("Current modelMatrix: " + modelMatrix);

        // Get the camera's view matrix
        let viewMatrix = camera.getViewMatrix();
        console.log("Current viewMatrix: " + viewMatrix);

        // Calculate the model-view-projection (MVP) matrix for this position
        let modelViewProjectionMatrix = projectionMatrix.mult(viewMatrix).mult(modelMatrix);
        console.log("Current MVP: " + modelViewProjectionMatrix);

        // Convert the MVP matrix to WebGL-compatible form
        let finalMatrixToPass = convertMatrixToFloat32Array(modelViewProjectionMatrix); 

        // Send the MVP to the shader functions
        gl.uniformMatrix4fv(matrixLocation, false, finalMatrixToPass); 

        // Set the color for the cube (red for the single cube)
        gl.uniform4f(colorLocation, 1.0, 0.0, 0.0, 1.0);  // Red

        // Draw the cube using lines
        gl.drawElements(gl.LINES, cubeEdgeIndices.length, gl.UNSIGNED_SHORT, 0);
    }

    // Slider event-listeners
    const translateX_Slider = document.getElementById("TranslateX");
    const translateY_Slider = document.getElementById("TranslateY");
    const translateZ_Slider = document.getElementById("TranslateZ");

    const rotateX_Slider    = document.getElementById("RotateX");
    const rotateY_Slider    = document.getElementById("RotateY");
    const rotateZ_Slider    = document.getElementById("RotateZ");

    const scaleX_Slider     = document.getElementById("ScaleX");
    const scaleY_Slider     = document.getElementById("ScaleY");
    const scaleZ_Slider     = document.getElementById("ScaleZ");

    // Translation slider event-handlers
    translateX_Slider.addEventListener("input", function (e) {
        let value = parseFloat(e.target.value); // Need the value as a number (event e returns .toString)
        
        // Get x, y, and z components of the new matrix
        let x = value;
        let y = 0;
        let z = 0;

        // console.log("Before translateX: " + cubeModelMatrix.v4.x + ", " + cubeModelMatrix.v4.y + ", 3");
        cubeModelMatrix = Matrix.translate(x, y, z);
        // console.log("After translateX: " + cubeModelMatrix.v4.x + ", " + cubeModelMatrix.v4.y + ", 3");

        updateModelMatrixSlider();
    });
    translateY_Slider.addEventListener("input", function (e) {
        let value = parseFloat(e.target.value); 

        let x = 0;
        let y = value;  
        let z = 0;
    
        // console.log("Before translateY: " + cubeModelMatrix.v4.x + ", " + cubeModelMatrix.v4.y + ", 3");
        cubeModelMatrix = Matrix.translate(x, y, z);
        // console.log("Before translateY: " + cubeModelMatrix.v4.x + ", " + cubeModelMatrix.v4.y + ", 3");
    
        updateModelMatrixSlider();
    });
    translateZ_Slider.addEventListener("input", function (e) {
        let value = parseFloat(e.target.value); 
        
        let x = 0; 
        let y = 0;
        let z = value;
    
        // console.log("Before translateZ: " + cubeModelMatrix.v4.x + ", " + cubeModelMatrix.v4.y + ", " + cubeModelMatrix.v4.z);
        cubeModelMatrix = Matrix.translate(x, y, z);
        // console.log("After translateZ: " + cubeModelMatrix.v4.x + ", " + cubeModelMatrix.v4.y + ", " + cubeModelMatrix.v4.z);
    
        updateModelMatrixSlider();
    });

    // Rotation slider event-handlers
    rotateX_Slider.addEventListener("input", function (e) {
        let theta = parseFloat(e.target.value);

        // console.log("Before rotateX: " + cubeModelMatrix.v4.x + ", " + cubeModelMatrix.v4.y + ", " + cubeModelMatrix.v4.z);
        cubeModelMatrix = Matrix.rotateX(theta);
        // console.log("After rotateX: " + cubeModelMatrix.v4.x + ", " + cubeModelMatrix.v4.y + ", " + cubeModelMatrix.v4.z);

        updateModelMatrixSlider();
    });
    rotateY_Slider.addEventListener("input", function (e) {
        let theta = parseFloat(e.target.value);

        // console.log("Before rotateY: " + cubeModelMatrix.v4.x + ", " + cubeModelMatrix.v4.y + ", " + cubeModelMatrix.v4.z);
        cubeModelMatrix = Matrix.rotateY(theta);
        // console.log("After rotateY: " + cubeModelMatrix.v4.x + ", " + cubeModelMatrix.v4.y + ", " + cubeModelMatrix.v4.z);

        updateModelMatrixSlider();
    });
    rotateZ_Slider.addEventListener("input", function (e) {
        let theta = parseFloat(e.target.value);

        // console.log("Before rotateZ: " + cubeModelMatrix.v4.x + ", " + cubeModelMatrix.v4.y + ", " + cubeModelMatrix.v4.z);
        cubeModelMatrix = Matrix.rotateZ(theta);
        // console.log("After rotateZ: " + cubeModelMatrix.v4.x + ", " + cubeModelMatrix.v4.y + ", " + cubeModelMatrix.v4.z);

        updateModelMatrixSlider();
    });

    // Scale slider event-handlers (not working)
    scaleX_Slider.addEventListener("input", function (e) {
        let value = parseFloat(e.target.value); 
        
        let x = value;  
        let y = cubeModelMatrix.v2.y;
        let z = cubeModelMatrix.v3.z;
    
        console.log("Ratios before scaleX: " + cubeModelMatrix.v1.x + ", " + cubeModelMatrix.v2.y + ", " + cubeModelMatrix.v3.z);
        cubeModelMatrix = Matrix.scaleXYZ(x, y, z);
        console.log("Ratios after scaleY: " + cubeModelMatrix.v1.x + ", " + cubeModelMatrix.v2.y + ", " + cubeModelMatrix.v3.z);
    
        updateModelMatrixSlider();
    });
    scaleY_Slider.addEventListener("input", function (e) {
        let value = parseFloat(e.target.value); 
        
        let x = cubeModelMatrix.v1.x;
        let y = value;
        let z = cubeModelMatrix.v3.z;
    
        // console.log("Ratios before scaleY: " + cubeModelMatrix.v1.x + ", " + cubeModelMatrix.v2.y + ", " + cubeModelMatrix.v3.z);
        cubeModelMatrix = Matrix.scaleXYZ(x, y, z);
        // console.log("Ratios after scaleY: " + cubeModelMatrix.v1.x + ", " + cubeModelMatrix.v2.y + ", " + cubeModelMatrix.v3.z);
    
        updateModelMatrixSlider();
    });
    scaleZ_Slider.addEventListener("input", function (e) {
        let value = parseFloat(e.target.value); 
        
        let x = cubeModelMatrix.v1.x;
        let y = cubeModelMatrix.v2.y;
        let z = value;
    
        // console.log("Ratios before scaleZ: " + cubeModelMatrix.v1.x + ", " + cubeModelMatrix.v2.y + ", " + cubeModelMatrix.v3.z);
        cubeModelMatrix = Matrix.scaleXYZ(x, y, z);
        // console.log("Ratios after scaleZ: " + cubeModelMatrix.v1.x + ", " + cubeModelMatrix.v2.y + ", " + cubeModelMatrix.v3.z);
    
        updateModelMatrixSlider();
    });

    // Update the model matrix after each transformation
    function updateModelMatrixSlider() {
        // Clear the background so it doesn't change abruptly
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (let position of scene.getPositionList()) {
            position.setMatrix(cubeModelMatrix);
            let modelMatrix = position.getMatrix();
            let modelViewProjectionMatrix = projectionMatrix.mult(camera.getViewMatrix()).mult(modelMatrix);
            let finalMatrixToPass = convertMatrixToFloat32Array(modelViewProjectionMatrix);

            gl.uniformMatrix4fv(matrixLocation, false, finalMatrixToPass);
            gl.drawElements(gl.LINES, cubeEdgeIndices.length, gl.UNSIGNED_SHORT, 0);
        }
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
