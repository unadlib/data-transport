const path = require('path');
const fs = require('fs');

module.exports = {
  entry: {
    index: './src/index.ts',
    serviceworker: './src/serviceworker.ts'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'data-transport': path.resolve(__dirname, '../..'),
    },
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    https: true,
    key: fs.readFileSync('localhost+2-key.pem'),
    cert: fs.readFileSync('localhost+2.pem'),
  }
};
