var path = require("path");
module.exports = {
  entry: {
    app: ["./src/index.js"]
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js"
  },
  module: {
    loaders: [{
      test: /\.jsx$/,
      loader: "babel-loader"
    },
      {
        test: /\.js$/,
        loader: "babel-loader"
      }]
  }

};