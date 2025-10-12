// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Accede a la propiedad correcta y verifica que exista
if (Array.isArray(config.resolver.assetExts)) {
  config.resolver.assetExts.push('cjs');
}

module.exports = config;