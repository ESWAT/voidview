module.exports = {
  devtool: 'none',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: 'css-loader'
      },
      {
        test: /\.otf$/,
        use: 'file-loader'
      }
    ]
  }
}
