// maybe this should be put somewhere else, but for now this works
import * as Graphviz from "./viz-standalone.mjs"

const scene = new renderer.Scene();
scene.addPosition(new renderer.Position());
scene.getPosition(0).model = new renderer.Sphere( 1, 6, 6 );
renderer.setColor(scene.getPosition(0).model, renderer.Color.red);
scene.getPosition(0).matrix = renderer.Matrix.translate(0, 0, -3);

// forward decl so we can modify this later
const resizerEl = document.getElementById('resizer');
const w = resizerEl.offsetWidth;
const h = resizerEl.offsetHeight;
const fb = new renderer.FrameBuffer(w, h);

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

    renderer.render1(scene, fb.vp);

    const ctx = document.getElementById("pixels").getContext("2d");
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.putImageData(new ImageData(fb.pixelBuffer, w, h), 0, 0);
}

// change viewport stuff
// maybe this could be somewhere else?
function setupViewer() {
    switch ( currMode ) {
        case VPMODE.DISTORT:
            // do nothing
            break
        case VPMODE.LETTERBOX:
            const wFB = fb.width
            const hFB = fb.height

            const dVP = 800 // TODO check me

            const hOffset = ( wFB - dVP ) / 2
            const vOffset = ( hFB - dVP ) / 2

            switch ( currAlign ) {
                case VPALIGN.TL:
                    fb.setViewport( 0, 0, dVP, dVP )
                    break
                case VPALIGN.TC:
                    fb.setViewport( hOffset, 0, dVP, dVP )
                    break
                case VPALIGN.TR:
                    fb.setViewport( wFB - dVP, 0, dVP, dVP )
                    break
                case VPALIGN.ML:
                    fb.setViewport( 0, vOffset, dVP, dVP )
                    break
                case VPALIGN.MC:
                    fb.setViewport( hOffset, vOffset, dVP, dVP )
                    break
                case VPALIGN.MR:
                    fb.setViewport( wFB - dVP, vOffset, dVP, dVP )
                    break
                case VPALIGN.BL:
                    fb.setViewport( 0, hFB - dVP, dVP, dVP )
                    break
                case VPALIGN.BC:
                    fb.setViewport( hOffset, hFB - dVP, dVP, dVP )
                    break
                case VPALIGN.BR:
                    fb.setViewport( wFB - dVP, hFB - dVP, dVP, dVP )
                    break
            }

            break
    }
}

// "enums"
// top left, middle center, bottom right, &c.
// this is based on a full keyboard's ten-key keypad
const VPALIGN = {
    TL: 7, TC: 8, TR: 9,
    ML: 4, MC: 5, MR: 6,
    BL: 1, BC: 2, BR: 3
}

const VPMODE = {
    DISTORT: 0,
    LETTERBOX: 1,
    LETTERBOXSCALE: 2,
    CROP: 3,
    CROPLETTERBOX: 4,
    CROPSCALE: 5
}

let currAlign = VPALIGN.TL
let currMode = VPMODE.DISTORT

// alignment
const alignmentRadios = document.alignmentForm.alignment
let radPrev = null
for ( let i = 0; i < alignmentRadios.length; i++ ) {
    alignmentRadios[ i ].addEventListener( "change", function() {
        if ( this !== radPrev ) {
            radPrev = this
        }

        currAlign = this.value
        setupViewer()
        // TODO:  change based on this.value, mapped to VPALIGN, fb.vp
    } )
}

// behavior
const behaviorSelect = document.getElementById( "behaviorDropDown" )
let behPrev = null
behaviorSelect.addEventListener( "change", function() {
    if ( this != behPrev ) {
        behPrev = this
    }

    currMode = this.value
    setupViewer()
    // TODO:  change based on this.value, mapped to VPMODE, fb.vp
} )

// set property of graph drawer
renderer.DrawSceneGraph.drawVertexList = true
let dotDescription = renderer.DrawSceneGraph.sceneToDot( scene )
// this only runs once the page is loaded,
// and is given an id so it can be deleted/updated later
Graphviz.instance().then( function( viz ) {
    let graph = document.body.appendChild( viz.renderSVGElement( dotDescription ) )
    graph.id = "sceneGraph"
} )