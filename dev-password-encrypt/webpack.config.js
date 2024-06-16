const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    content: './src/content.js',
    background: './src/background.js',
    popup: './src/popup.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },

  mode: 'production',
  watch: true,
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve('./static'),
          to: path.resolve('dist'),
        },
      ],
    }),
    new HtmlWebpackPlugin({ template: './src/index.html' }),
  ],
};
