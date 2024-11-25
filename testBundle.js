// maybe this should be put somewhere else, but for now this works
import * as Graphviz from "./viz-standalone.mjs"

const scene = new renderer.Scene();
scene.addPosition(new renderer.Position());
scene.getPosition(0).model = new renderer.Sphere( 1, 6, 6 );
renderer.setColor(scene.getPosition(0).model, renderer.Color.red);
scene.getPosition(0).matrix = renderer.Matrix.translate(0, 0, -3);

setInterval(rotate, 1000/40);

function rotate() {
    scene.getPosition(0).matrix.mult(renderer.Matrix.rotateY(1));
    //let x = Math.ceil( 30 * Math.sin( 0.0015 * Date.now() ) + 35 )
    //let x = 4
    //let col = scene.getPosition( 0 ).model.getColor()
    //scene.getPosition( 0 ).model = scene.getPosition( 0 ).model.remake( x, x )
    //renderer.setColor( scene.getPosition( 0 ).model, col )
    display();
}

function display() {
    const resizerEl = document.getElementById('resizer');
    const w = resizerEl.offsetWidth;
    const h = resizerEl.offsetHeight;

    const fb = new renderer.FrameBuffer(w, h);

    renderer.render1(scene, fb.vp);

    const ctx = document.getElementById("pixels").getContext("2d");
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.putImageData(new ImageData(fb.pixelBuffer, w, h), 0, 0);
}

// change viewport stuff
const behaviorSelect = document.alignmentSelect.alignment
let prev = null
for ( let i = 0; i < behaviorSelect.length; i++ ) {
    behaviorSelect[ i ].addEventListener( "change", function() {
        ( prev ) ? prev = prev : null

        if ( this !== prev ) {
            prev = this
        }

        console.log( this.value )
    } )
}

// set property of graph drawer
renderer.DrawSceneGraph.drawVertexList = true
let dotDescription = renderer.DrawSceneGraph.sceneToDot( scene )
// this only runs once the page is loaded,
// and is given an id so it can be deleted/updated later
Graphviz.instance().then( function( viz ) {
    let graph = document.body.appendChild( viz.renderSVGElement( dotDescription ) )
    graph.id = "sceneGraph"
} )