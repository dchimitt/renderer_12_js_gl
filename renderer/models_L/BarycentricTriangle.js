/*
 * Renderer Models. The MIT License.
 * Copyright (c) 2022 rlkraft@pnw.edu
 * See LICENSE for details.
*/

/**
   Create a wireframe model of a barycentricly subdivided
   equilateral triangle.

   See <a href="https://en.wikipedia.org/wiki/Barycentric_subdivision" target="_top">
                https://en.wikipedia.org/wiki/Barycentric_subdivision</a>
*/
//@ts-check

import {Model, Vertex, LineSegment} from "../scene/SceneExport.js";
import {format} from "../scene/util/UtilExport.js";

export default class BarycentricTriangle extends Model {
   /**@type {number}*/ #theta;
   /**@type {number}*/ #n;

   /**
      Create a barycentricly subdivided equilateral triangle
      in the xy-plane with corners on the unit circle and
      rotated by angle {@code theta} degrees.
      <p>
      The value of {@code n} should be less than 8.

      @param {number} n          number of barycentric subdivisions of this triangle
      @param {number} [theta=0]  rotation (in degrees) of the equilateral triangle
   */
   constructor( n, theta = 0 ) {
      super()

      if (n < 0)
         throw new Error( "n must be greater than or equal to 0" );

      this.#theta = theta;
      this.#n = n;

      let theta1 = theta * Math.PI/180.0,
          theta2 = 2.0 * Math.PI / 3.0;

      this.addVertex(new Vertex( Math.cos(theta1),
                                 Math.sin(theta1),
                                 0.0),
                     new Vertex( Math.cos(theta1 + theta2),
                                 Math.sin(theta1 + theta2),
                                 0.0),
                     new Vertex( Math.cos(theta1 + 2*theta2),
                                 Math.sin(theta1 + 2*theta2),
                                 0.0));

      this.addPrimitive(LineSegment.buildVertex(0, 1),
                        LineSegment.buildVertex(1, 2),
                        LineSegment.buildVertex(2, 0));

      if (n > 0)
         this.barycentric(0, 1, 2, n);
   }


   /**
      Recursively use barycentric subdivision to put into this
      {@link Model} vertices and line segments that subdivide
      the triangle whose vertices are indexed by {@code vIndex0},
      {@code vIndex1} and {@code vIndex2}.
      <p>
      The value of {@code n} should be less than 8.

      @param {number} vIndex0  index of a {link Vertex} of a triangle
      @param {number} vIndex1  index of a {link Vertex} of a triangle
      @param {number} vIndex2  index of a {link Vertex} of a triangle
      @param {number} n        number of barycentric subdivisions of this triangle
   */
   barycentric(vIndex0, vIndex1, vIndex2, n)
   {
      const v0 = this.vertexList[vIndex0],
            v1 = this.vertexList[vIndex1],
            v2 = this.vertexList[vIndex2];
      const index = this.vertexList.length;

      if (n > 0)
      {
         // Barycentric subdivision.
         // https://en.wikipedia.org/wiki/Barycentric_subdivision

         // Add four vertices to the model.
         this.addVertex(new Vertex(
         //         (1/3)*v0 + (1/3)*v1 + (1/3)*v2
                    (v0.x + v1.x + v2.x)/3.0,
                    (v0.y + v1.y + v2.y)/3.0,
                    (v0.z + v1.z + v2.z)/3.0));
         this.addVertex(new Vertex(
         //         (1/2)*v0 + (1/2)*v1
                    (v0.x + v1.x)/2.0,
                    (v0.y + v1.y)/2.0,
                    (v0.z + v1.z)/2.0));
         this.addVertex(new Vertex(
         //         (1/2)*v1 + (1/2)*v2
                    (v1.x + v2.x)/2.0,
                    (v1.y + v2.y)/2.0,
                    (v1.z + v2.z)/2.0));
         this.addVertex(new Vertex(
         //         (1/2)*v2 + (1/2)*v0
                    (v2.x + v0.x)/2.0,
                    (v2.y + v0.y)/2.0,
                    (v2.z + v0.z)/2.0));
         // Give a name to the index of each of the four new vertices.
         const vIndexCenter = index,
               vIndex01     = index + 1,
               vIndex12     = index + 2,
               vIndex20     = index + 3;
         // 6 new line segments
         this.addPrimitive(LineSegment.buildVertex(vIndex0,  vIndexCenter),
                           LineSegment.buildVertex(vIndex1,  vIndexCenter),
                           LineSegment.buildVertex(vIndex2,  vIndexCenter),
                           LineSegment.buildVertex(vIndex01, vIndexCenter),
                           LineSegment.buildVertex(vIndex12, vIndexCenter),
                           LineSegment.buildVertex(vIndex20, vIndexCenter));

         this.barycentric(vIndex0, vIndex01, vIndexCenter, n-1);
         this.barycentric(vIndex0, vIndex20, vIndexCenter, n-1);
         this.barycentric(vIndex1, vIndex01, vIndexCenter, n-1);
         this.barycentric(vIndex1, vIndex12, vIndexCenter, n-1);
         this.barycentric(vIndex2, vIndex12, vIndexCenter, n-1);
         this.barycentric(vIndex2, vIndex20, vIndexCenter, n-1);
      }
   }

   getHorizCount()
   {
      return this.#n;
   }

   getVertCount()
   {
      return Math.round(this.#theta);
   }

   /**
    * Make a new Barycentric Triangle with the given parameters 
    * 
    * @param {number} n number of barycentric subdivisions of this triangle
    * @param {number} k rotation of the equilateral triangle
    * @returns {BarycentricTriangle} the new barycentric triangle with the given parameters
    */
   remake(n, k)
   {
      return new BarycentricTriangle(n, k);
   }
}//BarycentricTriangle
