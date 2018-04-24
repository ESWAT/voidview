// temp workaround for https://github.com/electron-userland/electron-webpack/issues/125
const presetEnv = require('@babel/preset-env/lib/index.js')
delete presetEnv.default
delete presetEnv.isPluginRequired
delete presetEnv.transformIncludesAndExcludes

module.exports = {
  devtool: 'none',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: 'css-loader'
      }
    ]
  }
}
