/*
 * Renderer Models. The MIT License.
 * Copyright (c) 2022 rlkraft@pnw.edu
 * See LICENSE for details.
*/

/**
   Create a wireframe model of a partial sphere centered at the origin
<p>
   See <a href="https://en.wikipedia.org/wiki/Sphere" target="_top">
                https://en.wikipedia.org/wiki/Sphere</a>
<p>
   By a partial sphere we mean cutting a hole in the sphere around
   either the north or the south pole (that is, removing a spherical
   cap from either the top or bottom of the sphere) and also cutting
   from the sphere a spherical wedge between two lines of longitude.
<p>
   Notice that we can use this model to both model a spherical wedge
   and to model a sphere with a spherical wedge removed from it.
<p>
   Similarly, we can use this model to both model a spherical cap
   and to model a sphere with a spherical cap removed from it.
<p>
   See <a href="https://en.wikipedia.org/wiki/Spherical_cap" target="_top">
                https://en.wikipedia.org/wiki/Spherical_cap</a>
<p>
   See <a href="https://en.wikipedia.org/wiki/Spherical_segment" target="_top">
                https://en.wikipedia.org/wiki/Spherical_segment</a>
<p>
   See <a href="https://en.wikipedia.org/wiki/Spherical_wedge" target="_top">
                https://en.wikipedia.org/wiki/Spherical_wedge</a>
<p>
   The whole sphere of radius {@code r} is the surface of revolution generated
   by revolving the right half-circle in the xy-plane with radius {@code r} and
   center {@code (0,0,0)} all the way around the y-axis.
<p>
   Here are parametric equations for the right half-circle in the xy-plane with
   radius {@code r} and center {@code (0,0,0)}, parameterized from the top down.
   <pre>{@code
      x(phi) = r * sin(phi)  \
      y(phi) = r * cos(phi)   |-  0 <= phi <= PI
      z(phi) = 0             /
   }</pre>
   Here is the 3D rotation matrix that rotates around the y-axis
   by {@code theta} radians, {@code 0 <= theta <= 2*PI}
   <pre>{@code
      [ cos(theta)   0   sin(theta)]
      [     0        1       0     ]
      [-sin(theta)   0   cos(theta)]
   }</pre>
   If we multiply the rotation matrix with the half-circle
   parameterization, we get a parameterization of the sphere.
   <pre>{@code
      [ cos(theta)   0   sin(theta)]   [r * sin(phi)]
      [     0        1       0     ] * [r * cos(phi)]
      [-sin(theta)   0   cos(theta)]   [     0      ]

      = ( r * sin(phi) * cos(theta).    \
          r * cos(phi),                  |- 0<=theta<=2*PI,  0<=phi<=PI
         -r * sin(phi) * sin(theta) )   /
   }</pre>
   See
     <a href="https://en.wikipedia.org/wiki/Sphere#Equations_in_three-dimensional_space" target="_top">
              https://en.wikipedia.org/wiki/Sphere#Equations_in_three-dimensional_space</a>

   @see Sphere
   @see CircleSector
   @see DiskSector
   @see RingSector
   @see ConeSector
   @see CylinderSector
   @see TorusSector
*/
//@ts-check 

import {Model, Vertex, LineSegment} from "../scene/SceneExport.js";
import {format} from "../scene/util/UtilExport.js";
import { setColor } from "../scene/util/ModelShading.js"

export default class SphereSector extends Model
{
   /**@type {number} */ #r;
   /**@type {number} */ #theta1;
   /**@type {number} */ #theta2;
   /**@type {number} */ #phi1;
   /**@type {number} */ #phi2;
   /**@type {number} */ #n;
   /**@type {number} */ #k;

   /**
      Create a part of the sphere of radius r centered at the origin.
   <p>
      If {@code phi1 > 0}, then there is hole in the sphere around its
      north pole. Similarly, if {@code phi2 < PI}, then there is a hole
      in the sphere around its south pole. In other words, in spherical
      coordinates, lines of longitude in the model extend from angle
      {@code phi1} to angle {@code phi2}.
   <p>
      If {@code theta1 > 0} and {@code theta1 < theta2 < 2*PI}, then a
      spherical wedge is removed from the model. In other words, the
      (partial) circles of latitude in the model extend from angle
      {@code theta1} to angle {@code theta2}.
   <p>
      The last two parameters determine the number of lines of longitude
      and the number of (partial) circles of latitude in the model.
   <p>
      If there are {@code k} lines of longitude, then each (partial)
      circle of latitude will have {@code k-1} line segments.
      If there are {@code n} circles of latitude (including the edges
      of the removed spherical caps), then each line of longitude will
      have {@code n-1} line segments.
   <p>
      There must be at least four lines of longitude and at least
      three circles of latitude.

      @param {number} [r     =1]  radius of the sphere
      @param {number} [theta1=Math.PI/2]    beginning longitude angle (in radians) of the spherical wedge
      @param {number} [theta2=3*Math.PI/2]  ending longitude angle (in radians) of the spherical wedge
      @param {number} [phi1  =0]  beginning latitude angle (in radians) of the spherical segment
      @param {number} [phi2  =Math.PI]  ending latitude angle (in radians) of the spherical segment
      @param {number} [n     =17]  number of circles of latitude, not counting the edges of a spherical segment
      @param {number} [k     =8]  number of lines of longitude, not counting one edge of a spherical wedge
   */
   constructor(r=1, theta1=Math.PI/2, theta2 = 3*Math.PI/2, phi1 = 0, phi2 = Math.PI, n=17, k=8)
   {
      super(undefined, undefined, undefined, undefined, undefined,  format("Sphere Sector(%.2f,%.2f,%.2f,%.2f,%.2f,%d,%d)", r, theta1, theta2, phi1, phi2, n, k));

      if (n < 3)
         throw new Error("n must be greater than 2");
      if (k < 4)
         throw new Error("k must be greater than 3");

      theta1 = theta1 % (2*Math.PI);
      theta2 = theta2 % (2*Math.PI);
      if (theta1 < 0) theta1 = 2*Math.PI + theta1;
      if (theta2 < 0) theta2 = 2*Math.PI + theta2;
      if (theta2 <= theta1) theta2 = theta2 + 2*Math.PI;

      this.#r = r;
      this.#theta1 = theta1;
      this.#theta2 = theta2;
      this.#phi1 = phi1;
      this.#phi2 = phi2;
      this.#n = n;
      this.#k = k;

      // Create the sphere section's geometry.

      const deltaPhi = (phi2 - phi1) / (n - 1);
      const deltaTheta = (theta2 - theta1) / (k - 1);

      // An array of vertices to be used to create line segments.
      /**@type {Vertex[][]} */
      const v = new Array(n);
      for(let i = 0; i < v.length; i += 1)
         v[i] = new Array(k);

      // Create all the vertices.
      for (let j = 0; j < k; ++j) // choose an angle of longitude
      {
         const c1 = Math.cos(theta1 + j * deltaTheta);
         const s1 = Math.sin(theta1 + j * deltaTheta);
         for (let i = 0; i < n; ++i) // choose an angle of latitude
         {
            const c2 = Math.cos(phi1 + i * deltaPhi);
            const s2 = Math.sin(phi1 + i * deltaPhi);
            v[i][j] = new Vertex( r * s2 * c1,
                                  r * c2,
                                 -r * s2 * s1 );
         }
      }

      // this.add all of the vertices to this model.
      for (let i = 0; i < n; ++i)
      {
         for (let j = 0; j < k; ++j)
            this.addVertex( v[i][j] );
      }

      // Create the horizontal (partial) circles of latitude around the sphere.
      for (let i = 0; i < n; ++i)
      {
         for (let j = 0; j < k - 1; ++j)
            //                                v[i][j]        v[i][j+1]
            this.addPrimitive(LineSegment.buildVertex( (i * k) + j,  (i * k) + (j+1) ));
      }

      // Create the vertical lines of longitude from the top edge to the bottom edge.
      for (let j = 0; j < k; ++j)
      {
         for (let i = 0; i < n - 1; ++i)
            //                                v[i][j]        v[i+1][j]
            this.addPrimitive(LineSegment.buildVertex( (i * k) + j, ((i+1) * k) + j ));
      }
   }

   
   getHorizCount()
   {
      return this.#n;
   }

   getVertCount()
   {
      return this.#k;
   }

   /**
    * Build a new Model using the same parameters but the given line counts
    * @param {number} n the new horizontal line count
    * @param {number} k the new vertical line count
    * @returns {SphereSector} the new model with the same parameters but different line counts
    */
   remake(n, k) {
      let sphereSec = new SphereSector(this.#r, this.#theta1, this.#theta2, this.#phi1, this.#phi2, n, k);
      setColor( sphereSec, this.getColor() );

      return sphereSec
   }
}//SphereSector
