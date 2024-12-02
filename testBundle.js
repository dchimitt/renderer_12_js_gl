// maybe this should be put somewhere else, but for now this works
import * as Graphviz from "./viz-standalone.mjs"

const scene = new renderer.Scene();
scene.addPosition(new renderer.Position());
scene.getPosition(0).model = new renderer.Sphere( 1, 6, 6 );
renderer.setColor(scene.getPosition(0).model, renderer.Color.red);
scene.getPosition(0).matrix = renderer.Matrix.translate(0, 0, -3);

// use new ResizeObserver to limit minimum size
// https://stackoverflow.com/a/39312522
// 96.94% browser support https://caniuse.com/resizeobserver
// better than CSS resize which is only 83.12%!
const resizerEl = document.getElementById( "resizer" )
const DEFAULT_SIZE = resizerEl.offsetWidth // generated as square

function clampDivSize() {
    resizerEl.style.width  = Math.max( DEFAULT_SIZE, resizerEl.offsetWidth ) + "px"
    resizerEl.style.height = Math.max( DEFAULT_SIZE, resizerEl.offsetHeight ) + "px"
}
clampDivSize()

new ResizeObserver( clampDivSize ).observe( resizerEl )

// forward decl so we can access this later
// unfortunately it can't be const anymore
let fb

let wVP = DEFAULT_SIZE
let hVP = DEFAULT_SIZE
let xVP = 0
let yVP = 0

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
    const w = resizerEl.offsetWidth;
    const h = resizerEl.offsetHeight;

    fb = new renderer.FrameBuffer( w, h, renderer.Color.GRAY );

    setupViewer()

    fb.setViewport( wVP, hVP, xVP, yVP, renderer.Color.BLACK )
    renderer.render1( scene, fb.vp );

    const ctx = document.getElementById("pixels").getContext("2d");
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.putImageData( new ImageData( fb.pixelBuffer, w, h ), 0, 0 );
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

// change viewport stuff
// maybe this could be somewhere else?
function setupViewer() {
    switch ( currMode ) {
        case VPMODE.DISTORT: {
            xVP = 0
            yVP = 0

            wVP = fb.width
            hVP = fb.height
            break
        }
        case VPMODE.LETTERBOX: {
            const wFB = fb.width
            const hFB = fb.height

            const dVP = DEFAULT_SIZE

            const hOffset = ( wFB - dVP ) / 2
            const vOffset = ( hFB - dVP ) / 2

            wVP = dVP
            hVP = dVP

            switch ( currAlign ) {
                case VPALIGN.TL: {
                    xVP = 0
                    yVP = 0
                    
                    break
                }
                case VPALIGN.TC: {
                    xVP = hOffset
                    yVP = 0
                
                    break
                }
                case VPALIGN.TR: {
                    xVP = wFB - dVP
                    yVP = 0
                
                    break
                }
                case VPALIGN.ML: {
                    xVP = 0
                    yVP = vOffset
                
                    break
                }
                case VPALIGN.MC: {
                    xVP = hOffset
                    yVP = vOffset
                
                    break
                }
                case VPALIGN.MR: {
                    xVP = wFB - dVP
                    yVP = vOffset
                
                    break
                }
                case VPALIGN.BL: {
                    xVP = 0
                    yVP = hFB - dVP
                
                    break
                }
                case VPALIGN.BC: {
                    xVP = hOffset
                    yVP = hFB - dVP
                
                    break
                }
                case VPALIGN.BR: {
                    xVP = wFB - dVP
                    yVP = hFB - dVP
                
                    break
                }
            }

            break
        }
        default: {
            console.log( "No match found!" )
        }
    }
}

// alignment
const alignmentRadios = document.alignmentForm.alignment
let radPrev = null
for ( let i = 0; i < alignmentRadios.length; i++ ) {
    alignmentRadios[ i ].addEventListener( "change", function() {
        if ( this !== radPrev ) {
            radPrev = this
        }

        currAlign = Number( this.value )
        setupViewer()
    } )
}

// behavior
const behaviorSelect = document.getElementById( "behaviorDropDown" )
let behPrev = null
behaviorSelect.addEventListener( "change", function() {
    if ( this != behPrev ) {
        behPrev = this
    }

    currMode = Number( this.value )
    setupViewer()
} )

// set property of graph drawer
renderer.DrawSceneGraph.drawVertexList = true
let dotDescription = renderer.DrawSceneGraph.sceneToDot( scene )
// this only runs once the page is loaded,
// and is given an id so it can be deleted/updated later
// NOTE:  changing the width of this element causes the graph to draw under a huge margin
// i think this is because the function generates the graph at a ~5000 px offset for some reason
Graphviz.instance().then( function( viz ) {
    let graph = document.body.appendChild( viz.renderSVGElement( dotDescription ) )
    graph.id = "sceneGraph"
} )