import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configOpts =  
{

    // where the bundler should start
    entry: "./renderer/rendererExport.js",

    output: 
    {
        // the filename for the outputed bundle
        filename: "rendererBundle.js",

        // where to put the bundle I chose inside the renderer folder
        path: path.join(__dirname, "./renderer_out"),

        // make the bundle to be used as a package for imports
        // https://webpack.js.org/guides/author-libraries/
        library: "renderer",
        libraryTarget: 'umd',
        umdNamedDefine: true
    },  

    // makes a minified optimized bundle
    mode : "production",

    // makes a non minified non optimized bundle
    //mode : "development",
    
    // keeps the original lines of code
    // see: https://webpack.js.org/configuration/devtool/
    //devtool: "cheap-module-source-map",

    // tells the bundler the bundle is going to be used, so on the web
    target : "web",
};

export default configOpts;