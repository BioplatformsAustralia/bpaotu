const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: './src/init.tsx',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx']
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            babelrc: false,
            presets: [
              ['@babel/preset-env', { targets: { browsers: 'last 2 versions' } }],
              '@babel/preset-typescript',
              '@babel/preset-react'
            ],
            plugins: [['@babel/plugin-proposal-class-properties', { loose: true }], 'react-hot-loader/babel']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader'
      }
    ]
  },

  output: {
    filename: '[name]-bundle-[hash].js',
    path: path.resolve(__dirname, '../static/bpaotu/js'),
    library: 'otu',
    libraryTarget: 'var'
  },


  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        default: {
          enforce: true,
          priority: 1
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: 2,
          name: 'vendors',
          enforce: true,
          chunks: 'all'
        }
      }
    }
  }
}
