/*
    TODO:  class description once i know how exactly this works
*/

/*
TODO:  make these proper JSDocs
*/

export default class DrawSceneGraph {

    // you can do this in newer JS,
    static drawCameraDetails = true
    static drawMatrix = true
    static drawMatrixDetails = true
    static drawVertexList = false

    static visitedNodes = []
    static visitedNodeNames = []
    static nodeNumber

    static sceneToDot( scene ) {
        // eliminate identical duplicate edges
        let result = "strict digraph {\n"

        result += `graph [ordering="out"];\n`

        result += `graph [fontname="helvetica"];\n`
        result += `node  [fontname="helvetica"];\n`
        result += `edge  [fontname="helvetica"];\n`

        // Scene node
        result += `scene [label="Scene: ${ scene.name }"];\n`

        // Camera and Position nodes under the Scene node

        // Camera node and label
        let cameraNodeName = "Camera"

        result += cameraNodeName + " "
        if ( this.drawCameraDetails ) {
            result += `[label="${ scene.camera }"];\n`
        } else {
            result += `[label="Camera"];\n`
        }
        // Camera edge
        result += `scene -> ${ cameraNodeName };\n`

        // Position node and label
        let pListNodeName = "positionList"
        result += pListNodeName + " ";
        result += `[label="List<Position>"];\n`
        // Position edge
        result += `scene -> ${ pListNodeName };\n`

        this.visitedNodes = []
        this.visitedNodeNames = []
        this.nodeNumber = -1

        // for each top-level Position, create a node with three edges,
        // its model, its matrix, and its list of nested positions
        for ( let i = 0; i < scene.positionList.length; ++i ) {
            // Position node name
            ++this.nodeNumber
            let pNodeName = "_p" + this.nodeNumber

            // mark ths position as visited
            let positionReference = scene.getPosition( i )
            this.visitedNodes.push( positionReference )
            this.visitedNodeNames.push( pNodeName )

            // Position node and label
            result += pNodeName + " "
            result += `[label="Position: ${ positionReference.name } "];\n`

            // Position edge
            result += `${ pListNodeName } -> ${ pNodeName };\n`

            // this Position's matrix, model, and nested positions
            result += this.positionToDot( positionReference, pNodeName )
        }

    }

    static positionToDot( position, positionName ) {
        let result = ""

        if ( this.drawMatrix || this.drawMatrixDetails ) {
            // Matrix node name
            let tNodeName = positionName + "_Matrix"

            // Matrix node and label
            result += tNodeName + " "

            if ( this.drawMatrixDetails ) {
                result += `[label="Matrix: ${ position.getMatrix() }"];\n`
            } else {
                result += `[label="Matrix"];\n`
            }

            // Matrix edge
            result += `${ positionName } -> ${ tNodeName };\n`
        }

        // the position's model
        let modelReference = position.getModel()

        // check if the Model is being reused
        let modelVisited = this.visitedNodes.find( modelReference ) !== undefined

        if ( !modelVisited ) {
            // Model node name
            ++this.nodeNumber
            let mNodeName = "_m" + this.nodeNumber

            // mark this model as visited
            this.visitedNodes.push( modelReference )
            this.visitedNodeNames.push( mNodeName )

            // Model node and label
            result += mNodeName + " "
            result += `[label="Model: ${ modelReference.name }"];\n`

            // Model edge
            result += `${ positionName } -> ${ mNodeName };\n`

            // the model's vertex, color, and primitive lists
            result += this.modelToDot( modelReference, mNodeName )
        } else { // this Model has already been visited
            let index = this.visitedNodes.indexOf( modelReference )

            // Model node name
            let mNodeName = this.visitedNodeNames[ index ]

            // Model edge (to a previously visited Model node)
            result += `${ positionName } -> ${ mNodeName };\n`
        }

        // recursively convert this position's nested positions
        // into a dot description
        if ( !position.nestedPositions.length === 0 ) {
            // nested position list node and label
            let nestedPositionListNodeName = positionName + "_List "
            result += nestedPositionListNodeName + " "
            result += `[label="Array<Position>"];\n`

            // nested position list edge
            result += `${ positionName } -> ${ nestedPositionListNodeName };\n`

            for ( let i = 0; i < position.nestedPositions.length; ++i ) {
                // nested position
                let positionReference = position.getNestedPosition( i )

                // check if the Position is being reused
                let positionVisited = this.visitedNodes.find( positionReference ) !== undefined
            
                if ( !positionVisited ) {
                    // nested position node name
                    ++this.nodeNumber
                    let pNodeName = "_p" + this.nodeNumber

                    // mark this position as visited
                    this.visitedNodes.push( positionReference )
                    this.visitedNodeNames.push( pNodeName )

                    // nested position node and label
                    result += pNodeName + " ";
                    result += `[label="Position: ${ positionReference.name }"];\n`

                    // nested position edge
                    result += `${ nestedPositionListNodeName } -> ${ pNodeName };\n`

                    // the nested position's matrix, model, and nested positions
                    result += this.positionToDot( positionReference, pNodeName )
                } else { // this Position has already been visited
                    let index = this.visitedNodes.indexOf( positionReference )

                    // nested position node name
                    let pNodeName = this.visitedNodeNames[ index ]

                    // nested position edge (to a previously visited Position node)
                    result += `${ nestedPositionListNodeName } -> ${ pNodeName } ;\n`
                }
            }
        }
        return result
    }

    static modelToDot( model, nodeName ) {
        let result = ""

        if ( this.drawMatrix || this.drawMatrixDetails ) {
            // Matrix node name
            let tNodeName = nodeName + "_Matrix"

            // Matrix node and label
            result += tNodeName + " "

            if ( this.drawMatrixDetails ) {
                result += `[label="Matrix:\n${ model.getMatrix() }"];\n`
            } else {
                result += `[label="Matrix"];\n`
            }

            // Matrix edge
            result += `${ nodeName } -> ${ tNodeName };\n`
        }

        if ( this.drawVertexList ) {
            // Array<Vertex> node and label
            let vertexListNodeName = nodeName + "_vertexList"
            result += vertexListNodeName + " "
            result += `[label="Array<Vertex>"];\n`

            // Array<Vertex> edge
            result += `${ nodeName } -> ${ vertexListNodeName };\n`

            // Array<Vertex> children
            let vertexCounter = 0
            let lastVertexNodeName = vertexListNodeName
            for ( let v of model.vertexList ) {
                // vertex node name
                let vertexNodeName = nodeName + "_v" + vertexCounter

                // vertex node and label
                result += vertexNodeName + " "
                result += `[label="Vertex: ${ v }"];\n]`

                // vertex edge
                result += `${ lastVertexNodeName } -> ${ vertexNodeName };\n`

                lastVertexNodeName = vertexNodeName
                ++vertexCounter
            }

            // Array<Color> node and label
            let colorListNodeName = nodeName + "_colorList"
            result += colorListNodeName = " "
            result += `[label="Array<Color>"];\n`

            // Array<Color> edge
            result += `${ nodeName } -> ${ colorListNodeName };\n`

            // Array<Color> children
            let colorCounter = 0
            let lastColorNodeName = colorListNodeName
            for ( let c of model.colorList ) {
                // color node name
                let colorNodeName = nodeName + "_c" + colorCounter

                // color node and label
                result += colorNodeName + " "
                result += `[label="${ c }"];\n`

                // color edge
                result += `${ lastColorNodeName } -> ${ colorNodeName };\n`

                lastColorNodeName = colorNodeName
                ++colorCounter
            }

            // Array<Primitive> node and label
            let primitiveListNodeName = nodeName + "_primitiveList"
            result += primitiveListNodeName + " "
            result += `[label="Array<Primitive>"];\n`

            // Array<Primitive> edge
            result += `${ nodeName } -> ${ primitiveListNodeName };\n`

            // Array<Primitive> children
            let primitiveCounter = 0
            let lastPrimitiveNodeName = primitiveListNodeName
            for ( let p of model.primitiveList ) {
                // primitive node name
                let primitiveNodeName = nodeName + "_p" + primitiveCounter

                // primitive node and label
                result += primitiveNodeName + " "
                result += `[label="${ p }"];\n`

                // primitive edge
                result += `${ lastPrimitiveNodeName } -> ${ primitiveNodeName };\n`

                lastPrimitiveNodeName = primitiveNodeName
                primitiveCounter++
            }
        }

        // recursively conver this model's nested models
        // into a dot description
        if ( model.nestedModels.length !== 0 ) {
            // nested model list node and label
            let nestedModelListNodeName = nodeName + "_List "
            result += nestedModelListNodeName + " "
            result += `[label="Array<Model>"];\n`

            // nested model list edge
            result += `${ nodeName } -> ${ nestedModelListNodeName };\n`

            for ( let i = 0; i < model.nestedModels.length; ++i ) {
                // nested model
                let modelReference = model.getNestedModel( i )

                // check if the model is being reused
                let modelVisited = this.visitedNodes.find( modelReference ) !== undefined

                if ( !modelVisited ) {
                    // nested model node name
                    ++this.nodeNumber
                    let mNodeName = "_m" + this.nodeNumber

                    // mark this model as visited
                    this.visitedNodes.push( modelReference )
                    this.visitedNodeNames.push( mNodeName )

                    // nested model node and label
                    result += mNodeName + " "
                    result += `[label="Model: ${ modelReference.name }"];\n`

                    // nested model edge
                    result += `${ nestedModelListNodeName } -> ${ mNodeName };\n`

                    // the nested model's matrix and nested models
                    result += this.modelToDot( modelReference, mNodeName )
                } else {
                    let index = this.visitedNodes.indexOf( modelReference )

                    // nested model node name
                    let mNodeName = this.visitedNodeNames[ index ]

                    // nested model edge
                    result += `${ nestedModelListNodeName } -> ${ mNodeName };\n`
                }
            }
        }

        return result
    }
}