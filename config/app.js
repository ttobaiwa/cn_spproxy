let config;

const nodeEnv = process.env.NODE_ENV || "development";

if (nodeEnv === "devlopment") {
  config = require("./development.js");
} else {
  config = require("./production.js");
}

module.exports = config;
