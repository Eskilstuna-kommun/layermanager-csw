module.exports = {
  entry: [
    './layermanager.js'
  ],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/
      }
    ]
  },
  externals: ['Origo'],
  resolve: {
    extensions: ['*', '.js', '.scss']
  }
};
