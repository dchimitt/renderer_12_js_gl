/*
    FrameBuffer. The MIT License.
    Copyright (c) 2022 rlkraft@pnw.edu
    See LICENSE for details.
*/

/**
      A {@code Viewport} is an inner (non-static nested) class of
      {@link FrameBuffer}. That means that a {@code Viewport} has
      access to the pixel data of its "parent" {@link FrameBuffer}.
   <p>
      A {@code Viewport} is a two-dimensional sub array of its
      "parent" {@link FrameBuffer}. A {@code Viewport} is
      represented by its upper-left-hand corner and its
      lower-right-hand corner in the {@link FrameBuffer}.
   <p>
      When you set a pixel in a {@code Viewport}, you are really
      setting a pixel in its parent {@link FrameBuffer}.
   <p>
      A {@link FrameBuffer} can have multiple {@code Viewport}s.
   <p>
      {@code Viewport} coordinates act like Java {@link java.awt.Graphics2D}
      coordinates; the positive {@code x} direction is to the right and the
      positive {@code y} direction is downward.
*/

//@ts-check
import {FrameBuffer, Color} from "./FramebufferExport.js";
import {format} from "../scene/util/UtilExport.js";

export default class Viewport
{
    // Coordinates of the viewport within the framebuffer.
    /**@type {number} #vp_ur_x upper left x */ #vp_ul_x;
    /**@type {number} #vp_ur_y upper left y*/ #vp_ul_y;
    /**@type {number} #vp_lr_x lower right x*/ #vp_lr_x;
    /**@type {number} #vp_lr_y lower right y*/ #vp_lr_y;
    /**@type {Color}  #bgColorVP background color*/ #bgColorVP;
    /**@type {FrameBuffer} #parent the parent fb that the vp is in*/ #parent;

    /**
     * Create a {@code Viewport} with the given upper left hand corner
     * width and height within its parent {@link FrameBuffer} and with the given background color.
     * If no background color is give the default of {@link Color}.black is used.
     * If no upper left hand corner is given then uses (0, 0) as the upper left corner in the parent {@link FrameBuffer}
     * NOTE: This constructor does not use the background color to set the pixels
     * of this {@code Viewport} If you want the pixels of this {@code Viewport} to be cleared
     * to the background color call the {@link clearVP} method
     *
     * @param {number} width the width of this {@code Viewport}
     * @param {number} height the height of this {@code Viewport}
     * @param {FrameBuffer} parent the {FrameBuffer} that this {@code Viewport} is inside
     * @param {number} upperLeftX upper left hand x coordinate of this {@code Viewport}
     * @param {number} upperLeftY upper left hand y coordinate of this {@code Viewport}
     * @param {Color} color background {Color} for this {@code Viewport}
     */
    constructor(width, height, parent, upperLeftX = 0, upperLeftY = 0, color = Color.Black)
    {
        if ( typeof upperLeftX != "number" ||
             typeof upperLeftY != "number" ||
             typeof width != "number"      ||
             typeof height != "number")
                 throw new Error("upperLeftX, upperLeftY, width, height must be numerical");

        if (parent instanceof FrameBuffer == false)
            throw new Error("Parent is required and must be a FrameBuffer");

        if (color instanceof Color == false)
        {
            color = Color.Black;
        }

        this.#bgColorVP = color;
        this.#parent = parent;

        this.setViewport(width, height, upperLeftX, upperLeftY, this.#bgColorVP);
    }

    /**
     * Create a {@code Viewport} that is the exact replica of its parent {FrameBuffer}.
     *
     * @param {FrameBuffer} parent the parent {FrameBuffer} from which all data is taken from
     * @returns {Viewport} a viewport that is the exact same as its {parent}
     */
    static buildParent(parent)
    {
        if (parent instanceof FrameBuffer == false)
            throw new Error("Parent is required and must be a FrameBuffer");

        const vp = new Viewport(parent.getWidthFB(),
                                parent.getHeightFB(),
                                parent,
                                0,
                                0,
                                parent.getBackgroundColorFB());
        return vp;
    }

    /**
     * Create a {Viewport} that is the exact replica of the source {FrameBuffer} with its
     * upper left hand corner at the specified point inside its parent {FrameBuffer}
     * If no upper left hand corner is given uses (0, 0) as the default upper left corner in the parent {FrameBuffer}
     *
     * @param {FrameBuffer} source the {FrameBuffer} that the width, height, and pixel data is to be taken from
     * @param {FrameBuffer} parent the {FrameBuffer} that this {Viewport} is stored within
     * @param {number} upperLeftX the upper left hand x coordinate of this {Viewport}
     * @param {number} upperLeftY the upper left hand y coordinate of this {Viewport}
     * @returns {Viewport} this {Viewport} with the specified upper left corner inside its parent and the size and pixel data of the source
     */
    static buildFB(source, parent, upperLeftX = 0, upperLeftY = 0)
    {
        if (typeof upperLeftX != "number" || typeof upperLeftY != "number")
            throw new Error("UpperLeftX and UpperleftY must be numerical.");

        if (source instanceof FrameBuffer == false)
            throw new Error("Source must be of type FrameBuffer");

        if (parent instanceof FrameBuffer == false)
            throw new Error("Parent is required and must be a framebuffer");

        const vp = new Viewport(source.getWidthFB(),
                                source.getHeightFB(),
                                parent,
                                upperLeftX,
                                upperLeftY,
                                source.getBackgroundColorFB());

        for (let x = 0; x < source.getWidthFB(); x += 1)
        {
            for (let y = 0; y < source.getHeightFB(); y += 1)
            {
                vp.setPixelVP(x, y, source.getPixelFB(x, y));
            }
        }

        return vp;
    }

    /**
     * Create a {Viewport} that is the exact replica of the source {Viewport} with its
     * upper left hand corner at the specified point inside its parent {FrameBuffer}
     * if no upper left hand corner is given uses (0, 0) as the default upper left hand corner in the parent {FrameBuffer}
     *
     * @param {Viewport} source the {Viewport} that the width height and pixel data is to be taken from
     * @param {FrameBuffer} parent the {FrameBuffer} that this {Viewport} is stored within
     * @param {number} upperLeftX upper left hand x coordinate of this {Viewport}
     * @param {number} upperLeftY upper left hand y coordinate of this {Viewport}
     * @returns {Viewport} with the specified upper left corner inside its parent and the size and pixel data of the source
     */
    static buildVP(source, parent, upperLeftX = 0, upperLeftY = 0)
    {
        if (typeof upperLeftX != "number" || typeof upperLeftY != "number")
            throw new Error("UpperLeftX and UpperleftY must be numerical.");

        if (source instanceof Viewport == false)
            throw new Error("Source must be of type FrameBuffer");

        if (parent instanceof FrameBuffer == false)
            throw new Error("Parent is required and must be a framebuffer");

        const vp = new Viewport(source.getWidthVP(),
                                source.getHeightVP(),
                                parent,
                                upperLeftX,
                                upperLeftY,
                                source.getBackgroundColorVP());

        for (let x = 0; x < source.getWidthVP(); x += 1)
        {
            for (let y = 0; y < source.getHeightVP(); y += 1)
            {
                vp.setPixelVP(x, y, source.getPixelVP(x, y));
            }
        }

        return vp;
    }

    /**
     * Mutate this {Viewport} into the given upper left hand corner
     * of its parent {FrameBuffer} with the specified widht and height
     * if no upper left hand corner is given uses (0, 0) as the default
     * NOTE: will use Math.round() on upperLeftX and upperLeftY, width and height
     *
     * @param {number} width the width of this {Viewport}
     * @param {number} height the height of this {Viewport}
     * @param {number} upperLeftX horizontal coordinate of this {Viewport}
     * @param {number} upperLeftY vertical coordinate of this {Viewport}
     * @param {Color} bgCol the background color of this viewport
     */
    setViewport(width, height, upperLeftX = 0, upperLeftY = 0, bgCol)
    {
        if (typeof width != "number"      ||
            typeof height != "number"     ||
            typeof upperLeftX != "number" ||
            typeof upperLeftY != "number")
                throw new Error("All parameters must be numerical.");

        if(bgCol instanceof Color == false)
            throw new Error("Background Color must be a Color");

        upperLeftX = Math.round(upperLeftX);
        upperLeftY = Math.round(upperLeftY);
        width = Math.round(width);
        height = Math.round(height);

        this.#vp_ul_x = upperLeftX;
        this.#vp_ul_y = upperLeftY;
        this.#vp_lr_x = this.#vp_ul_x + width;
        this.#vp_lr_y = this.#vp_ul_y + height;
        this.#bgColorVP = bgCol;

        this.clearVP();
    }


    /**
     * Return a reference to the {FrameBuffer} that this {Viewport} is in
     *
     * @returns {FrameBuffer} a reference to the {FrameBuffer} that this {Viewport} is inside
     */
    getFrameBuffer()
    {
        return this.#parent;
    }


    framebuffer = () => {return this.#parent}


    get parent()
    {
        return this.#parent
    }


    /**
     * Get the Width of this {Viewport}
     *
     * @returns {number} width of this {Viewport}
     */
    getWidthVP()
    {
        return this.#vp_lr_x - this.#vp_ul_x;
    }


    get width()
    {
        return this.#vp_lr_x - this.#vp_ul_x;
    }


    /**
     * Get the height of this {Viewport}
     * @returns {number} the height of this {Viewport}
     */
    getHeightVP()
    {
        return this.#vp_lr_y - this.#vp_ul_y;
    }


    get height()
    {
        return this.#vp_lr_y - this.#vp_ul_y;
    }


    /**
     * Get this {Viewport} background color.
     *
     * @returns {Color} this {Viewport} background {Color}
     */
    getBackgroundColorVP()
    {
        return this.#bgColorVP;
    }


    get bgColorVP()
    {
        return this.#bgColorVP;
    }


    get vp_ul_x() {return this.#vp_ul_x;}
    get vp_ul_y() {return this.#vp_ul_y;}
    get vp_lr_x() {return this.#vp_lr_x;}
    get vp_lr_y() {return this.#vp_lr_y;}


    /**
     * Set this {Viewport} background color.
     * <p>
     * NOTE: this method does not clear the pixels of this {Viewport}.
     * to actually change all this {Viewport} pixels to the given
     * {Color} use the {clearVP} method.
     *
     * @param {Color} color this {Viewport} new background color
     */
    setBackgroundColorVP(color)
    {        
        if (color instanceof Color == false)
            throw new Error("Color is not of type Color");

        this.#bgColorVP = color;
    }


    set bgColorVP(color)
    {
        if (color instanceof Color == false)
            throw new Error("Color must be an intance of Color");

        this.#bgColorVP = color;
    }


    /**
     * Clear this {Viewport} using its background {Color}
     */
    clearVPDefault()
    {
        this.clearVP(this.getBackgroundColorVP());
    }


    /**
     * Clear this {Viewport} using the given {Color}
     *
     * @param {Color} color, the color to set this {Viewport} pixels to
     */
    clearVP(color = this.#bgColorVP)
    {
        if (color instanceof Color == false)
            throw new Error("Color is not of type Color");

        const rgba = color.rgb;
        for(let y = 0; y < this.height; y += 1)
        {
            //        how many rows till the vp * size per row        + how many rows we have covered
            let vpStartIndex = this.#vp_ul_y * (this.parent.width * 4) + (y * this.parent.width * 4);
            for(let x = this.#vp_ul_x * 4; x < (this.width + this.#vp_ul_x) * 4; x += 4)
            {
                const pixel = vpStartIndex  + x;

                this.parent.pixelBuffer[pixel + 0] = rgba[0];
                this.parent.pixelBuffer[pixel + 1] = rgba[1];
                this.parent.pixelBuffer[pixel + 2] = rgba[2];
                this.parent.pixelBuffer[pixel + 3] = rgba[3];
            }
        }
    }


    /**
     * Get the {Color} of the pixel with coordinates at
     * {(x, y)} realtive to this {Viewport}
     * Note: uses Math.round() to round x and y
     *
     * @param {number} x the horizontal coordinate within this {Viewport}
     * @param {number} y the vertical coordinate within this {Viewport}
     * @returns {Color} of the current pixel at the specified coordinate in this {Viewport}
     */
    getPixelVP(x, y)
    {
        if (typeof x != "number" ||
            typeof y != "number")
               throw new Error("X and Y must be numerical");

        x = Math.round(x);
        y = Math.round(y);

        return this.#parent.getPixelFB(this.#vp_ul_x + x,
                                       this.#vp_ul_y + y);
    }


    /**
     * Set the {Color} of the pixel with coordinates {(x, y)} within this {Viewport}
     * Note uses default value {Color}.black if no color is given
     * Note rounds x and y
     *
     * @param {number} x the horizontal coordinate within this {Viewport}
     * @param {number} y the vertical coordinate within this {Viewport}
     * @param {Color} color the {Color} that the {(x, y)} pixel should be set to within this {Viewport}
     */
    setPixelVP(x, y, color = Color.black)
    {
        if (typeof x != "number" || typeof y != "number")
            throw new Error("X and Y must be numerical");

        if (color instanceof Color == false)
            throw new Error("Color must be a Color");

        x = Math.round(x);
        y = Math.round(y);

        this.#parent.setPixelFB(this.#vp_ul_x + x,
                                this.#vp_ul_y + y,
                                color);
    }


    /**
     * Create a new {FrameBuffer} contianing the pixel data from this {Viewport}
     *
     * @returns {FrameBuffer} holding pixel data from this {Viewport}
     */
    convertVP2FB()
    {
        return(FrameBuffer.buildVP(this));
    }


    /**
         Write this {Viewport} to the specified PPM file.
      <p>
         <a href="https://en.wikipedia.org/wiki/Netpbm_format" target="_top">
                  https://en.wikipedia.org/wiki/Netpbm_format</a>

         @param filename {string}  name of PPM image file to hold {Viewport} data
    */
    dumpVP2File(filename)
    {
        if (typeof filename != "string")
            throw new Error("Filename must be a String");

        /* - TODO - don't support dumping to file yet
        this.#parent.dumpPixels2File(this.#vp_ul_x,
                                     this.#vp_ul_y,
                                     this.#vp_lr_x,
                                     this.#vp_lr_y,
                                     filename);
        */
    }


    /**
      For debugging very small {Viewport} objects.

      @return {string} a string representation of this {Viewport}
   */
    toString()
    {
        let result = "Viewport [w=" + this.width + ", h=" + this.height + "]\n";

        for (let j = 0; j < this.width; ++j)
        {
            result += " r   g   b |";
        }

        result += "\n";
        for (let i = 0; i < this.height; ++i)
        {
            for (let j = 0; j < this.width; ++j)
            {
                const c = this.getPixelVP(j, i);
                const color = Color.buildColor(c);

                result += format("%3d ", color.getRed());
                result += format("%3d ", color.getGreen());
                result += format("%3d|", color.getBlue());
            }
            result += "\n";
        }

        return result;
    }


    /**
     * For Testing.
     */
    static main()
    {
        const fb = new FrameBuffer(10, 10);

        console.log("creating vp1 = new VP(3, 3, fb = new FrameBuffer(10, 10), 4, 4, color.orange)");
        const vp1 = new Viewport(3, 3, fb, 4, 4, Color.orange);

        console.log("creating vp2 = VP.buildParent()");
        const vp2 = Viewport.buildParent(fb);

        console.log("creating vp3 = vP.buildFB");
        const vp3 = Viewport.buildFB(new FrameBuffer(5, 5), fb, 2, 2);

        console.log("creating vp4 = vp.buildVP");
        const vp4 = Viewport.buildVP(vp1, fb, 0, 0);

        console.log("");
        console.log("vp1.getFramebuffer()");
        console.log(vp1.getFrameBuffer().toString());

        console.log("");
        console.log("vp2.framebuffer()");
        console.log(vp2.framebuffer().toString());

        console.log("");
        console.log("vp3.parent");
        console.log(vp3.parent.toString());

        console.log("");
        console.log("vp1.getWidthVP()");
        console.log(vp1.getWidthVP());

        console.log("");
        console.log("vp1.getHeightVP()");
        console.log(vp1.getHeightVP());

        console.log("");
        console.log("vp4.width");
        console.log(vp4.width);

        console.log("");
        console.log("vp4.height");
        console.log(vp4.height);

        console.log("");
        console.log("vp2.getBackGroundColorVP()");
        console.log(vp2.getBackgroundColorVP().toString());

        console.log("");
        console.log("vp3.bgColorVP");
        console.log(vp3.bgColorVP.toString());

        console.log("");
        console.log("vp3.setBackGroundColorVP(Color.Green");
        vp3.setBackgroundColorVP(Color.Green);
        console.log(vp3.toString());

        console.log("");
        console.log("vp3.clearVPDefault()");
        vp3.clearVPDefault();
        console.log(vp3.toString());

        console.log("");
        console.log("vp2.setPixelVP(1, 1, Color.PINK)");
        vp2.setPixelVP(1, 1, Color.Pink);
        console.log(vp2.toString());

        console.log("");
        console.log("vp2.getPixelVP(1, 1");
        console.log(vp2.getPixelVP(1, 1).toString());

        /* TODO - do not support dumping to file yet
        console.log("");
        console.log("vp1.dumpVP2File(VP1.ppm)");
        vp1.dumpVP2File("VP1.ppm");

        console.log("");
        console.log("vp2.dumpVP2File(VP2.ppm)");
        vp2.dumpVP2File("VP2.ppm");

        console.log("");
        console.log("vp3.dumpVP2File(VP3.ppm)");
        vp3.dumpVP2File("VP3.ppm");

        console.log("");
        console.log("vp4.dumpVP2File(VP4.ppm)");
        vp4.dumpVP2File("VP4.ppm");

        console.log("");
        console.log("vp1.convertVP2FB()");
        console.log(vp1.convertVP2FB().toString());
        */
    }
}