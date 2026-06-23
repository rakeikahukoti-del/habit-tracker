const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const exclusionList =
  require("metro-config/private/defaults/exclusionList").default;

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

function escapePath(filePath) {
  return filePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Keep Metro from watching generated folders that are not part of the app.
// This lowers file watcher pressure on machines with conservative limits.
config.resolver.blockList = exclusionList([
  new RegExp(`${escapePath(path.join(projectRoot, ".expo"))}/.*`),
  new RegExp(`${escapePath(path.join(projectRoot, "outputs"))}/.*`),
  new RegExp(`${escapePath(path.join(projectRoot, "work"))}/.*`),
]);

module.exports = config;
