const webpack = require('webpack');
const path = require('path');
const fileSystem = require('fs');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const env = require('./env');

const pages = ['popup', 'options', 'devtools', 'panel', 'background', 'client'];
const alias = {
  'data-transport': path.resolve(__dirname, '../../..'),
};
const secretsPath = path.join(__dirname, `secrets.${env.NODE_ENV}.js`);
const fileExtensions = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'eot',
  'otf',
  'svg',
  'ttf',
  'woff',
  'woff2',
];

if (fileSystem.existsSync(secretsPath)) {
  alias['secrets'] = secretsPath;
}

const getEntry = (name) => path.join(__dirname, '../src/containers', name);

const options = {
  entry: pages.reduce(
    (entries, page) => Object.assign(entries, { [page]: getEntry(page) }),
    {
      content: getEntry('content'),
    }
  ),
  performance: {
    hints: false,
  },
  output: {
    path: path.join(__dirname, '../dist'),
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
        exclude: /node_modules/,
      },
      {
        test: new RegExp(`\.(${fileExtensions.join('|')})$`),
        loader: 'file-loader?name=[name].[ext]',
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias,
    extensions: ['.ts', '.js', '.json'],
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ['dist'],
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/settings/manifest.json',
          transform: (content) =>
            Buffer.from(
              JSON.stringify({
                description: process.env.npm_package_description,
                version: process.env.npm_package_version,
                ...JSON.parse(content.toString()),
              })
            ),
        },
      ],
    }),
    ...pages.map(
      (page) =>
        new HtmlWebpackPlugin({
          template: path.join(__dirname, '../src', `${page}.html`),
          filename: `${page}.html`,
          chunks: [page],
        })
    ),
    new WriteFilePlugin(),
  ],
};

if (env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-eval-source-map';
}

module.exports = options;
