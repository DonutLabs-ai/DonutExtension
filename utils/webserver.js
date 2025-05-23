// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";
process.env.ASSET_PATH = "/";

var WebpackDevServer = require("webpack-dev-server"),
  webpack = require("webpack"),
  config = require("../webpack.config"),
  env = require("./env"),
  path = require("path");

var options = config.chromeExtensionBoilerplate || {};
var excludeEntriesToHotReload = options.notHotReload || [];

for (var entryName in config.entry) {
  if (excludeEntriesToHotReload.indexOf(entryName) === -1) {
    config.entry[entryName] = [
      "webpack/hot/dev-server",
      `webpack-dev-server/client?hot=true&hostname=localhost&port=${env.PORT}`,
    ].concat(config.entry[entryName]);
  }
}

delete config.chromeExtensionBoilerplate;

var compiler = webpack(config);

var server = new WebpackDevServer(
  {
    hot: true,
    liveReload: false,
    client: {
      webSocketTransport: "sockjs",
    },
    webSocketServer: "sockjs",
    host: "localhost",
    open: ["http://localhost:3000/popup.html"],
    port: env.PORT,
    static: {
      directory: path.join(__dirname, "../build"),
    },
    proxy: [
      {
        context: ["/api"],
        target: "https://api.0x.org",
        changeOrigin: true,
        pathRewrite: {
          "^/api": "",
        },
      },
    ],
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    allowedHosts: "all",
  },
  compiler
);

(async () => {
  await server.start();
})();
