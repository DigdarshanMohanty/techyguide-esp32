const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const webpack = require("webpack");

// Load .env values for DefinePlugin fallback
const dotenv = require("dotenv");
const envValues = dotenv.config().parsed || {};

// Base config that applies to either development or production mode.
const config = {
  entry: "./src/index.js",
  output: {
    // Compile the source files into a bundle.
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  // Enable webpack-dev-server to get hot refresh of the app.
  devServer: {
    allowedHosts: "all",
  },
  module: {
    rules: [
      {
        // Load CSS files. They can be imported into JS files.
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html",
    }),
    // Load .env file — exposes process.env.* to browser bundle
    new Dotenv({ safe: false, silent: true }),
    // Inject COMPILE_SERVER_URL with fallback to localhost
    new webpack.DefinePlugin({
      __COMPILE_SERVER_URL__: JSON.stringify(
        envValues.COMPILE_SERVER_URL || "http://localhost:3100/compile"
      ),
    }),
  ],
};

module.exports = (env, argv) => {
  if (argv.mode === "development") {
    // Set the output path to the `build` directory
    // so we don't clobber production builds.
    config.output.path = path.resolve(__dirname, "build");

    // Generate source maps for our code for easier debugging.
    // Not suitable for production builds. If you want source maps in
    // production, choose a different one from https://webpack.js.org/configuration/devtool
    config.devtool = "eval-cheap-module-source-map";

    // Include the source maps for Blockly for easier debugging Blockly code.
    config.module.rules.push({
      test: /(blockly[/\\].*\.js)$/,
      use: [require.resolve("source-map-loader")],
      enforce: "pre",
    });

    // Ignore spurious warnings from source-map-loader
    // It can't find source maps for some Closure modules and that is expected
    config.ignoreWarnings = [/Failed to parse source map.*blockly/];
  }
  return config;
};
