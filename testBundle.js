// maybe this should be put somewhere else, but for now this works
import * as Graphviz from "./viz-standalone.mjs"

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

let scene = new renderer.Scene();
scene.addPosition(new renderer.Position());
scene.getPosition(0).model = new renderer.Sphere( 1, 6, 6 );
renderer.setColor(scene.getPosition(0).model, renderer.Color.red);
scene.getPosition(0).matrix = renderer.Matrix.translate(0, 0, -3);

let currAlign = VPALIGN.TL
let currMode = VPMODE.DISTORT
let currCrop = VPALIGN.TL
// use new ResizeObserver to limit minimum size
// https://stackoverflow.com/a/39312522
// 96.94% browser support https://caniuse.com/resizeobserver
// better than CSS resize which is only 83.12%!
const resizerEl = document.getElementById( "resizer" )
const DEFAULT_SIZE = resizerEl.offsetWidth // generated as square

function clampDivSize() {
    if ( currMode < 3 ) {
        resizerEl.style.width  = Math.max( DEFAULT_SIZE, resizerEl.offsetWidth ) + "px"
        resizerEl.style.height = Math.max( DEFAULT_SIZE, resizerEl.offsetHeight ) + "px"
    }
}
clampDivSize()

new ResizeObserver( clampDivSize ).observe( resizerEl )

// forward decl so we can access this later
// unfortunately it can't be const anymore
let fb

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
    renderer.render1( scene, fb.vp );

    const ctx = document.getElementById("pixels").getContext("2d");
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.putImageData( new ImageData( fb.pixelBuffer, w, h ), 0, 0 );
}

// change viewport stuff
// maybe this could be somewhere else?
function setupViewer() {
    switch ( currMode ) {
        case VPMODE.DISTORT: {
            fb.setViewport( fb.width, fb.height, 0, 0, renderer.Color.BLACK )
            scene.getCamera().projPerspective()
            break
        }
        case VPMODE.LETTERBOX: {
            const wFB = fb.width
            const hFB = fb.height

            const dVP = DEFAULT_SIZE

            const hOffset = ( wFB - dVP ) / 2
            const vOffset = ( hFB - dVP ) / 2

            switch ( currAlign ) {
                case VPALIGN.TL: {
                    fb.setViewport( dVP, dVP, 0, 0, renderer.Color.BLACK )
                    
                    break
                }
                case VPALIGN.TC: {
                    fb.setViewport( dVP, dVP, hOffset, 0, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.TR: {
                    fb.setViewport( dVP, dVP, wFB - dVP, 0, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.ML: {
                    fb.setViewport( dVP, dVP, 0, vOffset, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.MC: {
                    fb.setViewport( dVP, dVP, hOffset, vOffset, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.MR: {
                    fb.setViewport( dVP, dVP, wFB - dVP, vOffset, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.BL: {
                    fb.setViewport( dVP, dVP, 0, hFB - dVP, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.BC: {
                    fb.setViewport( dVP, dVP, hOffset, hFB - dVP, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.BR: {
                    fb.setViewport( dVP, dVP, wFB - dVP, hFB - dVP, renderer.Color.BLACK )
                
                    break
                }
            }

            scene.getCamera().projPerspective()

            break
        }
        case VPMODE.LETTERBOXSCALE: {
            const wFB = fb.width
            const hFB = fb.height

            const dVP = Math.min( wFB, hFB )

            const hOffset = ( hFB < wFB ) ? ( wFB - hFB ) / 2 : 0
            const vOffset = ( wFB < hFB ) ? ( hFB - wFB ) / 2 : 0

            switch ( currAlign ) {
                case VPALIGN.TL: {
                    fb.setViewport( dVP, dVP, 0, 0, renderer.Color.BLACK )
                    
                    break
                }
                case VPALIGN.TC: {
                    fb.setViewport( dVP, dVP, hOffset, 0, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.TR: {
                    fb.setViewport( dVP, dVP, wFB - dVP, 0, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.ML: {
                    fb.setViewport( dVP, dVP, 0, vOffset, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.MC: {
                    fb.setViewport( dVP, dVP, hOffset, vOffset, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.MR: {
                    fb.setViewport( dVP, dVP, wFB - dVP, vOffset, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.BL: {
                    fb.setViewport( dVP, dVP, 0, hFB - dVP, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.BC: {
                    fb.setViewport( dVP, dVP, hOffset, hFB - dVP, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.BR: {
                    fb.setViewport( dVP, dVP, wFB - dVP, hFB - dVP, renderer.Color.BLACK )
                
                    break
                }
            }
            
            scene.getCamera().projPerspective()

            break
        }
        case VPMODE.CROP: {
            const wFB = fb.width
            const hFB = fb.height

            const wVP = ( wFB < DEFAULT_SIZE ) ? wFB : DEFAULT_SIZE
            const hVP = ( hFB < DEFAULT_SIZE ) ? hFB : DEFAULT_SIZE

            switch ( currAlign ) {
                case VPALIGN.TL: {
                    fb.setViewport( wVP, hVP, 0, 0, renderer.Color.BLACK )
                    scene.getCamera().projPerspective(
                        -1,
                        -1 + ( 2 * wVP ) / DEFAULT_SIZE,
                         1 - ( 2 * hVP ) / DEFAULT_SIZE,
                         1
                    )

                    break
                }
                case VPALIGN.TC: {
                    fb.setViewport( wVP, hVP, ( wFB - wVP ) / 2, 0, renderer.Color.BLACK )
                    scene.getCamera().projPerspective(
                        -wVP / DEFAULT_SIZE,
                         wVP / DEFAULT_SIZE,
                         1 - ( 2 * hVP ) / DEFAULT_SIZE,
                         1
                    )
                
                    break
                }
                case VPALIGN.TR: {
                    fb.setViewport( wVP, hVP, wFB - wVP, 0, renderer.Color.BLACK )
                    scene.getCamera().projPerspective(
                         1 - ( 2 * wVP ) / DEFAULT_SIZE,
                         1,
                         1 - ( 2 * hVP ) / DEFAULT_SIZE,
                         1
                    )
                
                    break
                }
                case VPALIGN.ML: {
                    fb.setViewport( wVP, hVP, 0, ( hFB - hVP ) / 2, renderer.Color.BLACK )
                    scene.getCamera().projPerspective(
                        -1,
                        -1 + ( 2 * wVP ) / DEFAULT_SIZE,
                        -hVP / DEFAULT_SIZE,
                         hVP / DEFAULT_SIZE
                    )
                
                    break
                }
                case VPALIGN.MC: {
                    fb.setViewport( wVP, hVP, ( wFB - wVP ) / 2, ( hFB - hVP ) / 2, renderer.Color.BLACK )
                    scene.getCamera().projPerspective(
                        -wVP / DEFAULT_SIZE,
                         wVP / DEFAULT_SIZE,
                        -hVP / DEFAULT_SIZE,
                         hVP / DEFAULT_SIZE
                    )
                
                    break
                }
                case VPALIGN.MR: {
                    fb.setViewport( wVP, hVP, wFB - wVP, ( hFB - hVP ) / 2, renderer.Color.BLACK )
                    scene.getCamera().projPerspective(
                         1 - ( 2 * wVP ) / DEFAULT_SIZE,
                         1,
                        -hVP / DEFAULT_SIZE,
                         hVP / DEFAULT_SIZE
                    )
                
                    break
                }
                case VPALIGN.BL: {
                    fb.setViewport( wVP, hVP, 0, hFB - hVP, renderer.Color.BLACK )
                    scene.getCamera().projPerspective(
                        -1,
                        -1 + ( 2 * wVP ) / DEFAULT_SIZE,
                        -1,
                        -1 + (2  * hVP ) / DEFAULT_SIZE
                    )
                
                    break
                }
                case VPALIGN.BC: {
                    fb.setViewport( wVP, hVP, ( wFB - wVP ) / 2, hFB - hVP, renderer.Color.BLACK )
                    scene.getCamera().projPerspective(
                        -wVP / DEFAULT_SIZE,
                         wVP / DEFAULT_SIZE,
                        -1,
                        -1 + ( 2 * hVP ) / DEFAULT_SIZE
                    )
                
                    break
                }
                case VPALIGN.BR: {
                    fb.setViewport( wVP, hVP, wFB - wVP, hFB - hVP, renderer.Color.BLACK )
                    scene.getCamera().projPerspective(
                         1 - ( 2 * wVP ) / DEFAULT_SIZE,
                         1,
                        -1,
                        -1 + ( 2 * hVP ) / DEFAULT_SIZE
                    )
                
                    break
                }
            }

            break
        }
        case VPMODE.CROPLETTERBOX: {
            const wFB = fb.width
            const hFB = fb.height

            const wVP = Math.min( DEFAULT_SIZE, wFB )
            const hVP = Math.min( DEFAULT_SIZE, hFB )

            const hOffset = ( wVP < wFB ) ? ( wFB - wVP ) / 2 : 0
            const vOffset = ( hVP < hFB ) ? ( hFB - hVP ) / 2 : 0

            const w = wVP < DEFAULT_SIZE ? 2 * ( wVP / DEFAULT_SIZE ) : 2
            const h = hVP < DEFAULT_SIZE ? 2 * ( hVP / DEFAULT_SIZE ) : 2

            switch ( currAlign ) {
                case VPALIGN.TL: {
                    fb.setViewport( wVP, hVP, 0, 0, renderer.Color.BLACK )
                    
                    break
                }
                case VPALIGN.TC: {
                    fb.setViewport( wVP, hVP, hOffset, 0, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.TR: {
                    fb.setViewport( wVP, hVP, wFB - dVP, 0, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.ML: {
                    fb.setViewport( wVP, hVP, 0, vOffset, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.MC: {
                    fb.setViewport( wVP, hVP, hOffset, vOffset, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.MR: {
                    fb.setViewport( wVP, hVP, wFB - dVP, vOffset, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.BL: {
                    fb.setViewport( wVP, hVP, 0, hFB - dVP, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.BC: {
                    fb.setViewport( wVP, hVP, hOffset, hFB - dVP, renderer.Color.BLACK )
                
                    break
                }
                case VPALIGN.BR: {
                    fb.setViewport( wVP, hVP, wFB - dVP, hFB - dVP, renderer.Color.BLACK )
                
                    break
                }
            }

            switch ( currCrop ) {
                case VPALIGN.TL: {
                    scene.getCamera().projPerspective(
                        -1,
                        -1 + w,
                         1 - h,
                         1
                    )

                    break
                }
                case VPALIGN.TC: {
                    scene.getCamera().projPerspective(
                        -w / 2,
                         w / 2,
                         1 - h,
                         1
                    )

                    break
                }
                case VPALIGN.TR: {
                    scene.getCamera().projPerspective(
                         1 - w,
                         1,
                         1 - h,
                         1
                    )

                    break
                }
                case VPALIGN.ML: {
                    scene.getCamera().projPerspective(
                        -1,
                        -1 + w,
                        -h / 2,
                         h / 2
                    )

                    break
                }
                case VPALIGN.MC: {
                    scene.getCamera().projPerspective(
                        -w / 2,
                         w / 2,
                        -h / 2,
                         h / 2
                    )

                    break
                }
                case VPALIGN.MR: {
                    scene.getCamera().projPerspective(
                         1 - w,
                         1,
                        -h / 2,
                         h / 2
                    )

                    break
                }
                case VPALIGN.BL: {
                    scene.getCamera().projPerspective(
                        -1,
                        -1 + w,
                        -1,
                        -1 + h
                    )

                    break
                }
                case VPALIGN.BC: {
                    scene.getCamera().projPerspective(
                        -w / 2,
                         w / 2,
                        -1,
                        -1 + h
                    )

                    break
                }
                case VPALIGN.BR: {
                    scene.getCamera().projPerspective(
                         1 - w,
                         1,
                        -1,
                        -1 + h
                    )

                    break
                }
            }

            break
        }
        case VPMODE.CROPSCALE: {
            const wFB = fb.width
            const hFB = fb.height

            const wVP = wFB
            const hVP = hFB
            fb.setViewport( wVP, hVP, 0, 0, renderer.Color.BLACK )

            const r = wVP / hVP

            switch ( currAlign ) {
                case VPALIGN.TL: {
                    scene.getCamera().projPerspective(
                        -1,
                        ( r >= 1 ) ? 1 : 2 * r - 1,
                        ( r >= 1 ) ? 1 - 2 / r : -1,
                         1
                    )

                    break
                }
                case VPALIGN.TC: {
                    scene.getCamera().projPerspective(
                        ( r >= 1 ) ? -1 : -r,
                        ( r >= 1 ) ? 1 : r,
                        ( r >= 1 ) ? 1 - 2 / r : -1,
                        1
                    )

                    break
                }
                case VPALIGN.TR: {
                    scene.getCamera().projPerspective(
                        ( r >= 1 ) ? -1 : 1 - 2 * r,
                         1,
                        ( r >= 1 ) ? 1 - 2 / r : -1,
                         1
                    )

                    break
                }
                case VPALIGN.ML: {
                    scene.getCamera().projPerspective(
                        -1,
                        ( r >= 1 ) ? 1 : 2 * r - 1,
                        ( r >= 1 ) ? -1 / r : -1,
                        ( r >= 1 ) ? 1 / r : 1
                    )

                    break
                }
                case VPALIGN.MC: {
                    scene.getCamera().projPerspective(
                        ( r >= 1 ) ? -1 : -r,
                        ( r >= 1 ) ? 1 : r,
                        ( r >= 1 ) ? -1 / r : -1,
                        ( r >= 1 ) ? 1 / r : 1
                    )

                    break
                }
                case VPALIGN.MR: {
                    scene.getCamera().projPerspective(
                        ( r >= 1 ) ? -1 : 1 - 2 * r,
                         1,
                        ( r >= 1 ) ? -1 / r : -1,
                        ( r >= 1 ) ? 1 / r : 1
                    )

                    break
                }
                case VPALIGN.BL: {
                    scene.getCamera().projPerspective(
                        -1,
                        ( r >= 1 ) ? 1 : 2 * r - 1,
                        -1,
                        ( r >= 1 ) ? 2 / r - 1 : 1
                    )

                    break
                }
                case VPALIGN.BC: {
                    scene.getCamera().projPerspective(
                        ( r >= 1 ) ? -1 : -r,
                        ( r >= 1 ) ? 1 : r,
                        -1,
                        ( r >= 1 ) ? 2 / r - 1 : 1
                    )

                    break
                }
                case VPALIGN.BR: {
                    scene.getCamera().projPerspective(
                        ( r >= 1 ) ? -1 : 1 - 2 * r,
                         1,
                        -1,
                        ( r >= 1 ) ? 2 / r - 1 : 1
                    )

                    break
                }
            }
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
    } )
}

// crop
const cropRadios = document.cropForm.crop
let cropPrev = null
for ( let i = 0; i < cropRadios.length; i++ ) {
    cropRadios[ i ].addEventListener( "change", function() {
        if ( this !== cropPrev ) {
            cropPrev = this
        }

        currCrop = Number( this.value )
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

    if ( currMode > 0 ) {
        document.alignmentForm.style.visibility = "visible"
        document.alignmentForm.style.height = "100%"
    } else {
        document.alignmentForm.style.visibility = "hidden"
        document.alignmentForm.style.height = "0"
    }

    if ( currMode == 4 ) {
        document.cropForm.style.visibility = "visible"
        document.cropForm.style.height = "100%"
    } else {
        document.cropForm.style.visibility = "hidden"
        document.cropForm.style.height = "0"
    }
    
    if ( currMode < 3 ) {
        resizerEl.style.width  = Math.max( DEFAULT_SIZE, resizerEl.offsetWidth ) + "px"
        resizerEl.style.height = Math.max( DEFAULT_SIZE, resizerEl.offsetHeight ) + "px"
    }
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