const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  {
    node: {
      __dirname: true
    },
    mode: 'development',
    entry: './src/main.ts',
    target: 'electron-main',
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }],
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
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.js',
    },
    devServer: {
      writeToDisk: true,
    },
  },
  {
    node: {
      __dirname: true
    },
    mode: 'development',
    entry: './src/renderer.ts',
    target: 'electron-renderer',
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }],
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
      path: path.resolve(__dirname, 'dist'),
      filename: 'renderer.js',
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.join(__dirname, 'index.html'),
        filename: 'index.html',
      }),
    ]
  },
];
