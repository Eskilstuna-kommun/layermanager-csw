const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');


module.exports = merge(common, {
  output: {
    path: `${__dirname}/../../origo/plugins/`,
    publicPath: '/build/js',
    filename: 'layermanager.js',
    libraryTarget: 'var',
    libraryExport: 'default',
    library: 'Layermanager'
  },
  mode: 'development',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          {
            loader: "style-loader"
          },            
          {
            loader: "css-loader"
          },
          {
            loader: "sass-loader"
          }
        ]
      }      
    ]
  },  
 
  devServer: {
    static: './',
    port: 9008,
    devMiddleware: {
      //index: true,
      //mimeTypes: { 'text/html': ['phtml'] },
      //publicPath: '/publicPathForDevServe',
      //serverSideRender: true,
      writeToDisk: true
    },
    
  }
});
