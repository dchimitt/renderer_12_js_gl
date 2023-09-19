/*
 * Renderer 10. The MIT License.
 * Copyright (c) 2022 rlkraft@pnw.edu
 * See LICENSE for details.
*/

//@ts-check

import {TriangularPrism, Cylinder, ConeFrustum, Octahedron, Box,
        ParametricCurve, Cone, Tetrahedron, Sphere, Axes3D, PanelXZ} from "../renderer/models_L/ModelsExport.js";
import {Scene, Position, Matrix, Camera} from "../renderer/scene/SceneExport.js";
import * as ModelShading from "../renderer/scene/util/UtilExport.js";
import {FrameBuffer, Color} from "../renderer/framebuffer/FramebufferExport.js";
import {renderFB} from "../renderer/pipeline/PipelineExport.js";

// edited
// import {renderFB2} from "../renderer/pipeline/Pipelineexport.js";
//import {default as FrameBuffer2} from "../renderer/framebuffer/FrameBufferv2.js";

//import {keyPressed, printHelp, display, setScene, setFB} from "./InteractiveUtilities.js";


// Create the Scene object that we shall render.
const scene = Scene.buildFromName("Geometries_online_R8");

// Create a two-dimensional array of Positions holding Models.
const position = new Array(3);
for(let i = 0; i < 3; i += 1)
    position[i] = new Array(3);

// row 0 (first row in first image)
position[0][0] = Position.buildFromModel(new TriangularPrism(1.0, 1.0, 10, 30));
ModelShading.setColor(position[0][0].getModel(), Color.green);

position[0][1] = Position.buildFromModel(new Cylinder(0.5, 1.0, 30, 30));
ModelShading.setColor(position[0][1].getModel(), Color.blue);

position[0][2] = Position.buildFromModel(new ConeFrustum(0.5, 1.0, 1.0, 10, 10));
ModelShading.setColor(position[0][2].getModel(), Color.orange);

// row 1
position[1][0] = Position.buildFromModel(new Octahedron(2, 2, 2, 2, 2, 2));
//position[1][0] = Position.buildFromModel(Octahedron.buildMeshOctahedron(2, 2, 2, 2, 2, 2));
ModelShading.setColor(position[1][0].getModel(), Color.green);

position[1][1] = Position.buildFromModel(new Box(1.0, 1.0, 1.0));
ModelShading.setRandomPrimitiveColor(position[1][1].getModel());

position[1][2] = Position.buildFromModel(
        new ParametricCurve(
                    (t) => {return 0.3*(Math.sin(t) + 2*Math.sin(2*t)) + 0.1*Math.sin(t/6)},
                    (t) => {return 0.3*(Math.cos(t) - 2*Math.cos(2*t)) + 0.1*Math.sin(t/6)},
                    (t) => {return 0.3*(-Math.sin(3*t))},
                    0, 6*Math.PI, 120));
ModelShading.setRandomPrimitiveColor(position[1][2].getModel());

// row 2
position[2][0] = Position.buildFromModel(new Cone(0.5, 1.0, 30, 30));
ModelShading.setColor(position[2][0].getModel(), Color.yellow);

position[2][1] = Position.buildFromModel(new Tetrahedron(12, 12));
ModelShading.setColor(position[2][1].getModel(), Color.green);

position[2][2] = Position.buildFromModel(new Sphere(1.0, 30, 30));
ModelShading.setColor(position[2][2].getModel(), Color.cyan);

// Create x, y and z axes
const xyzAxes = Position.buildFromModel(new Axes3D(6, -6, 6, 0, 7, -7, Color.red));

// Create a horizontal coordinate plane model.
const xzPlane = Position.buildFromModel(new PanelXZ(-6, 6, -7, 7));
ModelShading.setColor(xzPlane.getModel(), Color.Gray);

// Add the positions (and their models) to the Scene.
scene.addPosition(xzPlane); // draw the grid first
scene.addPosition(xyzAxes); // draw the axes on top of the grid

xzPlane.setMatrix(Matrix.translate(0, -3, -10));
xyzAxes.setMatrix(Matrix.translate(0, -3, -10));

for (let i = position.length - 1;  i >= 0; --i) // from back to front
{
   for (let j = 0; j < position[i].length; ++j)
   {
      scene.addPosition(position[i][j]);
   }
}

const  fov    = 90.0;
const  aspect = 2.0;
const  near2   = 1.0;
scene.getCamera().projPerspectiveFOVY(fov, aspect, near2);

/*
// Create a framebuffer to render our scene into.
let vp_width  = 1800;
let vp_height =  900;
let fb = new FrameBuffer(vp_width, vp_height);

printHelp();
setScene(scene);
setFB(fb);
display();

// should be able to import keypressed function from abstract client
document.addEventListener("keypress", keyPressed);

let resizer = new ResizeObserver(display);
//@ts-ignore
resizer.observe(document.getElementById("resizer"));
*/

let played = true;
document.addEventListener('keypress', keyPressed);

const resizer = new ResizeObserver(display);
resizer.observe(document.getElementById("resizer"));

let k = 0;
let timer = null;

displayNextFrame();


function displayNextFrame()
{
    timer = setInterval(function()
    {
		const startTime = new Date().getTime();
          rotateModels();
          display();
        const stopTime = new Date().getTime();
        console.log("Wall-clock time: " + (stopTime - startTime));
    }, 1000/5);  // seem to be limited to about 5 frames per second?
}


function display()
{
    const resizer = document.getElementById("resizer");
    const w = resizer?.offsetWidth;
    const h = resizer?.offsetHeight;

    // @ts-ignore
    const ctx = document.getElementById("pixels").getContext("2d");
    if (ctx == null)
    {
       console.log("cn.getContext(2d) is null");
       return;
    }

    ctx.canvas.width = w;
    ctx.canvas.height = h;

    const fb = new FrameBuffer(w, h);
    renderFB(scene, fb);

    //const fb = new FrameBuffer2(w, h);
    //renderFB2(scene, fb);

    //ctx.getImageData().data = fb.pixelBuffer;
    //ctx.putImageData();

    /*
       This is not a good idea.
       We are copying a lot of data for every frame!
       We need to make the framebuffer implementation
       more friendly to the JavaScript canvas element.
    */

    
    const pixelData = new Uint8ClampedArray(fb.width * fb.height * 4);
    for (let y = 0; y < fb.height; y += 1)
    {
       for (let x = 0; x < fb.width; x += 1)
       {
          const index = y * (4*fb.width) + (4*x);
          const r = fb.getPixelFB(x, y).getRed();
          const g = fb.getPixelFB(x, y).getGreen();
          const b = fb.getPixelFB(x, y).getBlue();
          const a = fb.getPixelFB(x, y).getAlpha();

          pixelData[index + 0] = r;
          pixelData[index + 1] = g;
          pixelData[index + 2] = b;
          pixelData[index + 3] = a;
       }
    }
    ctx.putImageData(new ImageData(pixelData,
                                   fb.width,
                                   fb.height),
                                   fb.vp.vp_ul_x,
                                   fb.vp.vp_ul_y);
    
}


function rotateModels()
{
   // Place the xz-plane model in front of the camera
   // and rotate the plane.
   xzPlane.matrix2Identity()
          .mult( Matrix.translate(0, -3, -10) )
          .mult( Matrix.rotateY(k) );

   // Place the xyz-axes model in front of the camera
   // and rotate the axes.
   xyzAxes.matrix2Identity()
          .mult( Matrix.translate(0, -3, -10) )
          .mult( Matrix.rotateY(k) );

   // Place each model where it belongs in the rotated xz-plane
   // and also rotate each model on its own axis.
   for (let i = 0; i < position.length; ++i)
   {
      for (let j = 0; j < position[i].length; ++j)
      {
         // Push the model away from the camera.
         // Rotate the plane of the models.
         // Place the model where it belongs in the rotated plane.
         // Then rotate the model on its own axis.
         position[i][j].matrix2Identity()
                 .mult( Matrix.translate(0, -3, -10) )
                 .mult( Matrix.rotateY(k) )
                 .mult( Matrix.translate(-4+4*j, 0, 6-3*i) )
                 .mult( Matrix.rotateX(3*k) )
                 .mult( Matrix.rotateY(3*k) );
      }
   }

    if(k === 360) k = 0; else k++;
}


// Start and stop the animation.
// When stopped, advance the animation one frame at a time.
function keyPressed(event)
{
    const c = event.key;
    if ('f' == c) // advance animation one frame
    {
        if (!played)
        {
            rotateModels();
		}
    }
    else if ('p' == c) // start and stop animation
    {
        if (played)
        {
            clearInterval(timer);
            played = false;
        }
        else
        {
            displayNextFrame();
            played = true;
        }
    }
    display();
}
