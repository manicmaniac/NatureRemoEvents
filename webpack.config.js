const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const DotenvWebpackPlugin = require('dotenv-webpack');
const GasWebpackPlugin = require('gas-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './dev/index.ts',
  output: {
    path: __dirname + '/src',
    filename: 'index.js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      },
      {
        test: /\.pug$/,
        loader: 'pug-loader',
        options: {
          pretty: true
        }
      }
    ]
  },
  resolve: {
    extensions: [
      '.ts'
    ]
  },
  optimization: {
    minimize: false
  },
  plugins: [
    new DotenvWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env.TOKEN': JSON.stringify(process.env.TOKEN),
      'process.env.REMO_ACCESS_TOKEN': JSON.stringify(process.env.REMO_ACCESS_TOKEN),
      'process.env.DEVICE_ID': JSON.stringify(process.env.DEVICE_ID),
      'process.env.SLACK_WEBHOOK_URL': JSON.stringify(process.env.SLACK_WEBHOOK_URL)
    }),
    new CopyWebpackPlugin([
      {
        from: 'dev/appsscript.json',
        to: 'appsscript.json'
      }
    ]),
    new GasWebpackPlugin(),
    new HtmlWebpackPlugin({
      filename: 'charts.html',
      template: './dev/charts.pug'
    })
  ]
};
