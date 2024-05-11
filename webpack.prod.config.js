const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");
const webpack = require("webpack");
const dotenv = require("dotenv");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "production",
  devtool: "source-map",
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  plugins: [
    sentryWebpackPlugin({
      org: "calcont",
      project: "javascript-react",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
    new webpack.DefinePlugin({
      "process.env": JSON.stringify(dotenv.config().parsed),
    }),
  ],
});
