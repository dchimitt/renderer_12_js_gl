/*
 * Renderer 10. The MIT License.
 * Copyright (c) 2022 rlkraft@pnw.edu
 * See LICENSE for details.
*/

/**
   A {@link Model} that implements {@code IMeshMaker} can
   rebuild its geometric mesh with different values for
   the number of lines of latitude and longitude while
   keeping all the other model parameters unchanged.

   JavaScript has no interfaces so we need to cheat.
*/

export default class IMeshMaker extends Model {
    /**
     * IMPORTANT
     * this is really dodgy and i don't know if it's the 
     * proper way...you cannot extend two classes, so i
     * have this "interface" extend Model, then have each
     * model extend this class.  i still need all of Model's
     * functionality, so i instantiate a new Model and store
     * it as "superShape" so i can call its methods.
     * 
     * this will require a good bit of rewriting...will this
     * even work?
     */
    superShape

    // this constructor should throw an error if called by
    // instantiating this class
    constructor() {
        super()
        this.superShape = new Model( undefined, undefined, undefined, undefined, undefined, "[New Model Mesh]", true );
        if ( this.constructor === IMeshMaker ) {
            throw new Error( "Cannot instantiate interface IMeshMaker." )
        }
    }

    /**
     * Get the number of latitude lines this {@link Model} has.
     * @returns {number} lines of latitude
     */
    getHorzCount() {
        throw new Error( "Method getHorzCount() must be implemented." )
    }

    /**
     * Get the number of longitude lines this {@link Model} has.
     * @returns {number} lines of longitude
     */
    getVertCount() {
        throw new Error( "Method getVertCount() must be implemented." )
    }

    /**
     * 
     * @param {number} n - number of lines of latitude for the returned {@link Model}
     * @param {number} k - number of lines of longitude for the returned {@link Model}
     * @returns {Model} a new insteance of the {@link Model} with updated parameters 
     */
    remake( n, k ) {
        throw new Error( "Method remake( n, k ) must be implemented." )
    }
}