const slsw = require('serverless-webpack');
const webpack = require('webpack');

module.exports = {
  entry: slsw.lib.entries,
  optimization: {
    minimize: false
  },
  target: 'node',
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  module: {
    rules: [
      {
        test: [/\.tsx?$/],
        exclude: [/node_modules/, /\.test.tsx?$/],
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.IgnorePlugin(/^pg-native$/),
    new webpack.IgnorePlugin(/^canvas$/), // imported by jsdom from simple-wapplyzer, not used so we can ignore.
    new webpack.IgnorePlugin(/^ssh2$/) // imported by dockerode, doesn't compile properly when deployed to AWS lambda, not used in production (only used in local development) so we can ignore.
  ],
  resolve: {
    modules: ['node_modules', 'scripts'],
    extensions: ['.ts', '.tsx', '.json', '.js', '.jsx']
  }
};
