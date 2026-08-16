const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
const dotenv = require("dotenv");

const env = dotenv.config().parsed;

function parseEnv() {
  return Object.keys(env).reduce((acc, key) => {
    acc[key] = JSON.stringify(env[key]);
    return acc;
  }, {});
}

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public", "index.html"),
      // The favicon is an SVG declared directly in the template <head>; the
      // CopyWebpackPlugin below emits it (and manifest.json, robots.txt) into
      // the build. In dev they're served straight from public/ (static).
      filename: "index.html",
    }),
    // Emit everything in public/ (favicon.svg, manifest.json, robots.txt, ...)
    // into the build output — WITHOUT this the production bundle shipped no
    // favicon at all (dev worked only because it serves public/ statically).
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "public"),
          to: ".",
          globOptions: { ignore: ["**/index.html"] },
        },
      ],
    }),
    new webpack.DefinePlugin({
      "process.env": parseEnv(),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              ["@babel/preset-react", { runtime: "automatic" }],
            ],
          },
        },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        exclude: /node_modules/,
        use: [
          "style-loader",
          { loader: "css-loader" },
          {
            loader: "postcss-loader",
          },
          "sass-loader",
        ],
      },
      {
        test: /\.(png|jp(e*)g|svg|gif)$/,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
};
