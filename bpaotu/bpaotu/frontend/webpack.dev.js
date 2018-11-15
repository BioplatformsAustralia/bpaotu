const merge = require('webpack-merge')
const BundleTracker = require('webpack-bundle-tracker')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:8000',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    },
    host: '0.0.0.0',
    port: 3000,
    // Setting hot to true doesn't work currently, so passing in --hot as argument in packages.json
    // hot: true
  },

  output: {
    publicPath: 'http://localhost:3000/assets/bundles/'
  },

  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new BundleTracker({ filename: './webpack-stats.json' })
  ],

  devtool: 'inline-source-map'
})
